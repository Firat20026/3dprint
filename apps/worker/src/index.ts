/**
 * frint3d slicer worker.
 *
 * Flow:
 *   1. Web API writes SliceJob (status=QUEUED) + enqueues {sliceJobId} to Redis "slice".
 *   2. This worker picks up the job, loads the SliceJob + Material + PrintProfile.
 *   3. Reads STL/3MF bytes from local storage, runs OrcaSlicer (or mock).
 *   4. Parses .gcode.3mf → grams + seconds. Computes unitPriceTRY via pricing engine.
 *   5. Writes DONE back to DB. UI polling picks it up.
 *
 * Failures are caught, SliceJob marked FAILED with errorText, BullMQ sees success
 * (no retry) — retries would re-run a deterministic slicer for the same inputs.
 */
import { Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import path from "node:path";
import { prisma } from "./db.js";
import { absolutePath } from "./storage.js";
import { runSlicer } from "./slicer.js";
import { getSettings } from "./settings.js";
import { calculatePrice } from "./pricing.js";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const QUEUE_NAME = "slice";

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
connection.on("connect", () => console.log(`[worker] redis → ${REDIS_URL}`));
connection.on("error", (err) => console.error("[worker] redis:", err.message));

type SliceJobPayload = { sliceJobId: string };

// Density by material type — used to convert volume → grams in OrcaSlicer filament.json.
// Also used by mock slicer. Values in g/cm³ at room temp (common vendor spec).
const DENSITY_BY_TYPE: Record<string, number> = {
  PLA: 1.24,
  PETG: 1.27,
  TPU: 1.21,
  ABS: 1.04,
  ASA: 1.07,
};

const worker = new Worker<SliceJobPayload>(
  QUEUE_NAME,
  async (job: Job<SliceJobPayload>) => {
    const { sliceJobId } = job.data;
    console.log(`[worker] picking up sliceJob=${sliceJobId}`);
    const started = Date.now();

    await prisma.sliceJob.update({
      where: { id: sliceJobId },
      data: { status: "RUNNING", startedAt: new Date(), errorText: null },
    });

    try {
      const sj = await prisma.sliceJob.findUniqueOrThrow({
        where: { id: sliceJobId },
        include: { material: true, profile: true },
      });

      const inputPath = absolutePath(sj.sourceFileKey);
      const density = DENSITY_BY_TYPE[sj.material.type] ?? 1.24;

      console.log(
        `[worker] slicing ${path.basename(inputPath)} ` +
          `layer=${sj.profile.layerHeightMm}mm infill=${sj.profile.infillPercent}% ` +
          `material=${sj.material.name}`,
      );

      const result = await runSlicer({
        inputStlPath: inputPath,
        layerHeightMm: sj.profile.layerHeightMm,
        infillPercent: sj.profile.infillPercent,
        supportsEnabled: sj.profile.supportsEnabled,
        filamentDensity: density,
      });

      const settings = await getSettings();
      const breakdown = calculatePrice({
        filamentGrams: result.filamentGrams,
        printSeconds: result.printSeconds,
        pricePerGramTRY: Number(sj.material.pricePerGramTRY),
        settings,
      });

      await prisma.sliceJob.update({
        where: { id: sliceJobId },
        data: {
          status: "DONE",
          filamentGrams: result.filamentGrams,
          filamentMeters: result.filamentMeters,
          printSeconds: result.printSeconds,
          unitPriceTRY: breakdown.unitPriceTRY,
          finishedAt: new Date(),
        },
      });

      const elapsedMs = Date.now() - started;
      console.log(
        `[worker] DONE sliceJob=${sliceJobId} ` +
          `grams=${result.filamentGrams} seconds=${result.printSeconds} ` +
          `price=₺${breakdown.unitPriceTRY} elapsed=${elapsedMs}ms`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[worker] FAILED sliceJob=${sliceJobId}: ${msg}`);
      await prisma.sliceJob.update({
        where: { id: sliceJobId },
        data: {
          status: "FAILED",
          errorText: msg.slice(0, 2000),
          finishedAt: new Date(),
        },
      });
      // Don't rethrow — BullMQ would retry a deterministic slicer for the same inputs,
      // which won't help. Admin can manually requeue.
    }
  },
  { connection, concurrency: 1 },
);

worker.on("ready", () => console.log(`[worker] listening on "${QUEUE_NAME}"`));
worker.on("failed", (job, err) => {
  console.warn(`[worker] bullmq failed ${job?.id}: ${err.message}`);
});

async function shutdown(signal: string) {
  console.log(`[worker] ${signal} → shutting down...`);
  await worker.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
