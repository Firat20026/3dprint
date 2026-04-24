/**
 * Basit local filesystem storage. Faz 5'te MinIO/S3'e migrate edilebilir — interface aynı kalır.
 *
 * Key formatı: "designs/<uuid>.stl" veya "thumbnails/<uuid>.jpg" — dosya yolu değil, göreceli anahtar.
 * Tüm dosyalar UPLOAD_DIR altında tutulur, /api/files/[...path] ile sunulur.
 */
import "server-only";
import { randomUUID, createHash } from "node:crypto";
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import path from "node:path";

export { publicUrlFor } from "./urls";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./data/uploads";

export const KINDS = {
  design: "designs",
  thumbnail: "thumbnails",
  meshy: "meshy",
  meshyInput: "meshy-inputs",
} as const;
export type StorageKind = keyof typeof KINDS;

function absolutePath(key: string): string {
  // Path traversal koruması
  const normalized = path.posix.normalize(key);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error("invalid storage key");
  }
  return path.join(UPLOAD_DIR, normalized);
}

export async function saveUpload(
  kind: StorageKind,
  originalName: string,
  bytes: ArrayBuffer | Uint8Array | Buffer,
): Promise<{ key: string; fileHash: string; sizeBytes: number }> {
  const buffer = Buffer.isBuffer(bytes)
    ? bytes
    : Buffer.from(bytes as ArrayBuffer);
  const ext = path.extname(originalName).toLowerCase() || "";
  const id = randomUUID();
  const key = `${KINDS[kind]}/${id}${ext}`;
  const full = absolutePath(key);

  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);

  const fileHash = createHash("sha256").update(buffer).digest("hex");
  return { key, fileHash, sizeBytes: buffer.byteLength };
}

export async function readStoredFile(key: string): Promise<Buffer> {
  return readFile(absolutePath(key));
}

export async function storedFileStat(key: string) {
  return stat(absolutePath(key));
}
