/**
 * Magic-byte validation for uploaded 3D model files.
 *
 * Extension checks alone are bypassed easily by renaming. We sniff the first
 * few bytes here to confirm the file actually matches the format we accept.
 *
 *   - STL ASCII:    starts with literal "solid " (6 bytes)
 *   - STL Binary:   no magic; minimum 84 bytes (80-byte header + 4-byte count)
 *                   we accept any file >= 84 bytes if extension is .stl and
 *                   it isn't ASCII (assumed binary).
 *   - 3MF:          ZIP container, starts with "PK\x03\x04" (4 bytes).
 */

export type ValidExt = ".stl" | ".3mf";

export function validateModelFile(
  bytes: Buffer | Uint8Array,
  ext: ValidExt,
): { ok: true } | { ok: false; reason: string } {
  if (bytes.length < 4) {
    return { ok: false, reason: "Dosya çok küçük" };
  }

  if (ext === ".3mf") {
    // 3MF = ZIP magic
    const ok =
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      bytes[2] === 0x03 &&
      bytes[3] === 0x04;
    return ok
      ? { ok: true }
      : {
          ok: false,
          reason: "Geçerli bir 3MF (ZIP) dosyası değil — magic byte uyuşmadı",
        };
  }

  if (ext === ".stl") {
    // ASCII STL starts with "solid " (5 chars + space). Tolerate "solid"
    // followed by whitespace or LF.
    const first6 = Buffer.from(bytes.subarray(0, Math.min(6, bytes.length)));
    const head = first6.toString("ascii").toLowerCase();
    if (head.startsWith("solid")) {
      return { ok: true };
    }
    // Otherwise treat as binary STL — needs at least 84 bytes.
    if (bytes.length < 84) {
      return {
        ok: false,
        reason:
          "STL binary formatı için minimum 84 bayt gerekli (header eksik)",
      };
    }
    return { ok: true };
  }

  return { ok: false, reason: `bilinmeyen uzantı: ${ext as string}` };
}
