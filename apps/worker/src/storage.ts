/**
 * Worker-side storage helpers. Mirrors apps/web/lib/storage.ts.
 * Uses the same UPLOAD_DIR / key convention so both sides see the same files.
 */
import { randomUUID, createHash } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./data/uploads";

export const KINDS = {
  design: "designs",
  thumbnail: "thumbnails",
  slice: "slices",
} as const;
export type StorageKind = keyof typeof KINDS;

export function absolutePath(key: string): string {
  const normalized = path.posix.normalize(key);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error("invalid storage key");
  }
  return path.join(UPLOAD_DIR, normalized);
}

export async function readStoredFile(key: string): Promise<Buffer> {
  return readFile(absolutePath(key));
}

export async function saveBuffer(
  kind: StorageKind,
  originalName: string,
  bytes: Buffer,
): Promise<{ key: string; fileHash: string; sizeBytes: number }> {
  const ext = path.extname(originalName).toLowerCase() || "";
  const id = randomUUID();
  const key = `${KINDS[kind]}/${id}${ext}`;
  const full = absolutePath(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
  const fileHash = createHash("sha256").update(bytes).digest("hex");
  return { key, fileHash, sizeBytes: bytes.byteLength };
}
