/**
 * Parse OrcaSlicer .gcode.3mf output to extract filament grams + print time.
 *
 * OrcaSlicer packages its slice result as a ZIP with:
 *   - Metadata/slice_info.config  (XML with filament used, used_g, used_m)
 *   - Metadata/plate_1.gcode      (gcode with a "; estimated printing time ..." comment)
 *
 * We read just enough bytes to pull these out — no full ZIP extraction to disk.
 */
import yauzl from "yauzl";

export type SliceResult = {
  filamentGrams: number;
  filamentMeters: number;
  printSeconds: number;
};

const TARGET_ENTRIES = new Set([
  "Metadata/slice_info.config",
  "Metadata/plate_1.gcode",
]);

export async function parseGcode3mf(buffer: Buffer): Promise<SliceResult> {
  const files = await readSelectEntries(buffer, TARGET_ENTRIES);

  const sliceInfo = files.get("Metadata/slice_info.config");
  const plateGcode = files.get("Metadata/plate_1.gcode");

  if (!sliceInfo) throw new Error("slice_info.config not found in .gcode.3mf");
  if (!plateGcode) throw new Error("plate_1.gcode not found in .gcode.3mf");

  const filamentGrams = extractFilamentGrams(sliceInfo.toString("utf8"));
  const filamentMeters = extractFilamentMeters(sliceInfo.toString("utf8"));
  const printSeconds = extractPrintSeconds(plateGcode.toString("utf8"));

  if (filamentGrams <= 0) {
    throw new Error(`invalid filament grams: ${filamentGrams}`);
  }
  if (printSeconds <= 0) {
    throw new Error(`invalid print seconds: ${printSeconds}`);
  }

  return { filamentGrams, filamentMeters, printSeconds };
}

/** Extract `used_g="12.34"` (grams) from slice_info XML. */
export function extractFilamentGrams(xml: string): number {
  const m = xml.match(/used_g\s*=\s*"([0-9.]+)"/i);
  return m && m[1] ? parseFloat(m[1]) : 0;
}

/** Extract `used_m="1.234"` (meters) — optional. */
export function extractFilamentMeters(xml: string): number {
  const m = xml.match(/used_m\s*=\s*"([0-9.]+)"/i);
  return m && m[1] ? parseFloat(m[1]) : 0;
}

/**
 * Extract print time from gcode. OrcaSlicer writes lines like:
 *   ; estimated printing time (normal mode) = 2h 36m 25s
 *   ; estimated printing time (silent mode) = 3h 10m 0s
 * We prefer normal mode; fall back to any match.
 */
export function extractPrintSeconds(gcode: string): number {
  const head = gcode.slice(0, 20_000); // time comments are at top or bottom; OrcaSlicer puts it at both
  const tail = gcode.slice(-20_000);
  const window = head + "\n" + tail;

  const normal = window.match(
    /estimated printing time\s*\(normal mode\)\s*=\s*([^\n\r]+)/i,
  );
  const any = normal ?? window.match(/estimated printing time[^=]*=\s*([^\n\r]+)/i);
  if (!any || !any[1]) return 0;
  return parseDuration(any[1].trim());
}

/** "2h 36m 25s" → 9385. Also handles "1d 2h", "45m", "90s". */
export function parseDuration(s: string): number {
  let total = 0;
  const parts = s.matchAll(/(\d+(?:\.\d+)?)\s*([dhms])/gi);
  for (const p of parts) {
    if (!p[1] || !p[2]) continue;
    const n = parseFloat(p[1]);
    switch (p[2].toLowerCase()) {
      case "d": total += n * 86400; break;
      case "h": total += n * 3600; break;
      case "m": total += n * 60; break;
      case "s": total += n; break;
    }
  }
  return Math.round(total);
}

function readSelectEntries(
  buffer: Buffer,
  wanted: Set<string>,
): Promise<Map<string, Buffer>> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zip) => {
      if (err || !zip) return reject(err ?? new Error("zip open failed"));
      const out = new Map<string, Buffer>();
      zip.readEntry();
      zip.on("entry", (entry) => {
        if (!wanted.has(entry.fileName)) {
          zip.readEntry();
          return;
        }
        zip.openReadStream(entry, (err2, stream) => {
          if (err2 || !stream) return reject(err2 ?? new Error("stream open failed"));
          const chunks: Buffer[] = [];
          stream.on("data", (c: Buffer) => chunks.push(c));
          stream.on("end", () => {
            out.set(entry.fileName, Buffer.concat(chunks));
            if (out.size === wanted.size) {
              zip.close();
              resolve(out);
            } else {
              zip.readEntry();
            }
          });
          stream.on("error", reject);
        });
      });
      zip.on("end", () => resolve(out));
      zip.on("error", reject);
    });
  });
}
