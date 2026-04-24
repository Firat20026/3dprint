/**
 * Unit tests for parse.ts helpers. Run with `pnpm --filter @frint3d/worker tsx src/parse.test.ts`.
 */
import { extractFilamentGrams, extractFilamentMeters, extractPrintSeconds, parseDuration } from "./parse.js";

function assertEq(label: string, got: unknown, want: unknown) {
  const ok = got === want;
  console.log(`${ok ? "✓" : "✗"} ${label}  got=${String(got)} want=${String(want)}`);
  if (!ok) process.exitCode = 1;
}

// parseDuration
assertEq("2h 36m 25s", parseDuration("2h 36m 25s"), 9385);
assertEq("45m",        parseDuration("45m"), 2700);
assertEq("1d 2h",      parseDuration("1d 2h"), 93600);
assertEq("90s",        parseDuration("90s"), 90);
assertEq("empty",      parseDuration(""), 0);

// extractPrintSeconds — real OrcaSlicer comment
const gcode = `
; HEADER_BLOCK_START
; BambuStudio dummy
; estimated printing time (normal mode) = 2h 36m 25s
; estimated printing time (silent mode) = 3h 10m 0s
G28
`;
assertEq("gcode normal", extractPrintSeconds(gcode), 9385);

// extractFilamentGrams/Meters
const xml = `<?xml version="1.0"?><metadata>
  <filament id="1" used_g="27.83" used_m="9.24" />
</metadata>`;
assertEq("grams", extractFilamentGrams(xml), 27.83);
assertEq("meters", extractFilamentMeters(xml), 9.24);
