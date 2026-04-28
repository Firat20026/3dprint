/**
 * OrcaSlicer invocation. Two modes:
 *
 *   SLICER_MODE=real  → spawn OrcaSlicer CLI (ORCA_SLICER_BIN) with process + filament
 *                        profiles, export .gcode.3mf, parse it.
 *   SLICER_MODE=mock  → skip the binary. Produce deterministic fake grams/seconds
 *                        from the input STL size + layer height + infill. Lets us
 *                        smoke-test the full pipeline on macOS dev where no Linux
 *                        AppImage exists.
 *
 * Defaults to "mock" unless ORCA_SLICER_BIN points to an executable file.
 */
import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseGcode3mf, type SliceResult } from "./parse.js";

const ORCA_BIN = process.env.ORCA_SLICER_BIN ?? "";
const SLICER_MODE = (process.env.SLICER_MODE ?? "").toLowerCase();
const SLICE_TIMEOUT_MS = Number(process.env.SLICE_TIMEOUT_MS ?? 5 * 60 * 1000);

export type SliceInput = {
  inputStlPath: string;
  layerHeightMm: number;
  infillPercent: number;
  supportsEnabled: boolean;
  /** PLA=1.24, PETG=1.27, TPU=1.21 — grams/cm³. OrcaSlicer uses this for used_g. */
  filamentDensity: number;
  /** 1-based plate to slice. 1 = first/only plate (default). When the input
   *  is a multi-plate 3MF, set this to the plate the user added to the cart. */
  plateIndex?: number;
};

export type SliceOutput = SliceResult & {
  resultPath: string | null; // path to .gcode.3mf (null in mock mode)
};

function useMock(): boolean {
  if (SLICER_MODE === "mock") return true;
  if (SLICER_MODE === "real") return false;
  return !ORCA_BIN || !existsSync(ORCA_BIN);
}

export async function runSlicer(input: SliceInput): Promise<SliceOutput> {
  if (useMock()) {
    const r = await mockSlice(input);
    return { ...r, resultPath: null };
  }
  return runOrcaSlicer(input);
}

/**
 * Deterministic mock: hashes file bytes, derives grams proportional to file size,
 * print time from grams + layer height + infill.
 * Good enough to exercise the pipeline end-to-end; replace with real slicer in prod.
 */
async function mockSlice(input: SliceInput): Promise<SliceResult> {
  const st = await stat(input.inputStlPath);
  const sizeKB = st.size / 1024;

  // Heuristic: STL size ~ vertex count ~ model complexity. Map to grams roughly.
  // 20mm cube ≈ 2.5KB → ~10g, which matches typical solid cube. Not accurate,
  // just stable + monotonic so UI can show "Standart > Hızlı" sensibly.
  const baseGrams = Math.max(3, sizeKB * 1.1);
  const infillFactor = 0.5 + (input.infillPercent / 100) * 0.9; // 15%→0.635 / 100%→1.4
  const grams = round2(baseGrams * infillFactor);

  // Speed / quality ∝ 1/layerHeight. 0.2mm = 1x, 0.12mm ≈ 1.67x time.
  const qualityFactor = 0.2 / Math.max(0.08, input.layerHeightMm);
  const gramsPerHour = 10; // ballpark print speed
  const hours = (grams / gramsPerHour) * qualityFactor;
  const printSeconds = Math.max(120, Math.round(hours * 3600));

  const filamentMeters = round2(
    grams / (input.filamentDensity * Math.PI * Math.pow(1.75 / 2, 2) / 1000),
  );

  return { filamentGrams: grams, filamentMeters, printSeconds };
}

async function runOrcaSlicer(input: SliceInput): Promise<SliceOutput> {
  const workDir = path.join(tmpdir(), `slice-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  const processJson = path.join(workDir, "process.json");
  const filamentJson = path.join(workDir, "filament.json");
  const outPath = path.join(workDir, "out.gcode.3mf");

  const printerProfile =
    process.env.SLICER_PRINTER_PROFILE ?? "/profiles/snapmaker_u1.json";

  await writeFile(
    processJson,
    JSON.stringify({
      type: "process",
      name: "frint3d-dyn",
      layer_height: input.layerHeightMm.toString(),
      sparse_infill_density: `${input.infillPercent}%`,
      enable_support: input.supportsEnabled ? "1" : "0",
    }),
  );
  await writeFile(
    filamentJson,
    JSON.stringify({
      type: "filament",
      name: "frint3d-dyn",
      filament_diameter: ["1.75"],
      filament_density: [input.filamentDensity.toString()],
    }),
  );

  // OrcaSlicer's --slice flag: 0 = all plates, 1..N = specific plate.
  // Cart's per-plate items already create one SliceJob per plate, so we
  // ask the slicer to render exactly that plate.
  const plate = input.plateIndex && input.plateIndex > 0 ? input.plateIndex : 1;

  const args = [
    "--load-settings", `${printerProfile};${processJson}`,
    "--load-filaments", filamentJson,
    "--slice", String(plate),
    "--export-3mf", outPath,
    input.inputStlPath,
  ];

  console.log(
    `[slicer] orca-slicer plate=${plate} layer=${input.layerHeightMm} infill=${input.infillPercent}% input=${path.basename(input.inputStlPath)}`,
  );
  await spawnWithTimeout(ORCA_BIN, args, SLICE_TIMEOUT_MS);

  if (!existsSync(outPath)) {
    throw new Error("OrcaSlicer finished but no output file produced");
  }

  const buf = await readFile(outPath);
  const parsed = await parseGcode3mf(buf);

  // Cleanup temp files — keep result if caller wants to persist it separately.
  await rm(workDir, { recursive: true, force: true }).catch(() => {});

  return { ...parsed, resultPath: null };
}

function spawnWithTimeout(
  bin: string,
  args: string[],
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: "pipe" });
    let stderr = "";
    let stdout = "";
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    proc.stdout.on("data", (d) => {
      stdout += d.toString();
    });

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error(`slicer timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    proc.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      // Combine stdout + stderr so OrcaSlicer's "[ERROR]" lines (which it
      // sometimes prints to stdout) aren't lost. Keep the tail because
      // most exit details land in the last few hundred bytes.
      const tail = (stdout + "\n" + stderr).slice(-1500);
      reject(new Error(`OrcaSlicer exited ${code}: ${tail.trim()}`));
    });
    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
