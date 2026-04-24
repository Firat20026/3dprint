/**
 * Meshy AI mock provider.
 *
 * Gerçek Meshy API yerine ~3 saniye sonra bundled sample STL'yi döndürür.
 * Geliştirme sırasında ücret ödemeden uçtan uca akışı test edebilmek için.
 *
 * `lib/meshy/client.ts` interface'i ileride real provider için aynı kalır;
 * şu an yalnızca mock path kullanılıyor — `MESHY_PROVIDER=real` yapıldığında
 * `real.ts` yazılır (ayrı PR).
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, copyFile, readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./data/uploads";

/**
 * Meshy mock — `sample/cube_20mm.stl`'yi yeni bir meshy key altına kopyalar.
 * Gerçek implementasyonda burada external API sonucunu indiriyor olacağız.
 */
async function produceMockArtifact(): Promise<{
  modelFileKey: string;
  thumbnailUrl: string | null;
}> {
  const sampleSource = path.resolve(
    process.cwd(),
    "../../samples/cube_20mm.stl",
  );

  // cwd = apps/web; monorepo kökündeki samples/ dizini
  let bytes: Buffer | null = null;
  try {
    bytes = await readFile(sampleSource);
  } catch {
    // dev sırasında farklı cwd'de çalışıyorsa fallback: process.cwd() altında samples/
    const fallback = path.resolve(process.cwd(), "samples/cube_20mm.stl");
    bytes = await readFile(fallback).catch(() => null);
  }
  if (!bytes) throw new Error("meshy mock: sample STL bulunamadı");

  const id = randomUUID();
  const key = `meshy/${id}.stl`;
  const fullDest = path.join(UPLOAD_DIR, key);
  await mkdir(path.dirname(fullDest), { recursive: true });

  // copyFile yerine buffer'ı yaz — her iki yol da tamam; buffer zaten elimizde.
  const { writeFile } = await import("node:fs/promises");
  await writeFile(fullDest, bytes);
  void copyFile; // type import kept for readability

  return { modelFileKey: key, thumbnailUrl: null };
}

/**
 * Bir MeshyJob'ı mock-olarak tamamlar. /api/meshy/generate çağırır.
 * setTimeout ile fake async gecikme — server restart olursa job kaybedilir,
 * prototip için kabul edilebilir.
 */
export function scheduleMockCompletion(jobId: string, delayMs = 3000): void {
  setTimeout(async () => {
    try {
      await prisma.meshyJob.update({
        where: { id: jobId },
        data: { status: "RUNNING" },
      });
      const { modelFileKey, thumbnailUrl } = await produceMockArtifact();
      await prisma.meshyJob.update({
        where: { id: jobId },
        data: {
          status: "DONE",
          modelFileKey,
          thumbnailUrl: thumbnailUrl ?? undefined,
        },
      });
    } catch (e) {
      await prisma.meshyJob
        .update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            errorText: e instanceof Error ? e.message : "mock failed",
          },
        })
        .catch(() => void 0);
    }
  }, delayMs);
}
