/**
 * Meshy AI mock provider.
 *
 * Gerçek Meshy API yerine ~3 saniye sonra bundled sample STL'yi döndürür.
 * Geliştirme sırasında ücret ödemeden uçtan uca akışı test edebilmek için.
 *
 * `lib/meshy/client.ts` interface'i ileride real provider için aynı kalır;
 * şu an yalnızca mock path kullanılıyor — `MESHY_PROVIDER=real` yapıldığında
 * `real.ts` yazılır (ayrı PR). Real provider de aynı `markJobFailed` helper'ını
 * çağıracak, böylece refund logic tek yerde durur.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, copyFile, readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { refundMeshyJob } from "@/lib/meshy/refund";
import { track, logError, EVENTS } from "@/lib/observability";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./data/uploads";

/**
 * Meshy mock — `sample/cube_20mm.stl`'yi yeni bir meshy key altına kopyalar.
 */
async function produceMockArtifact(): Promise<{
  modelFileKey: string;
  thumbnailUrl: string | null;
}> {
  const sampleSource = path.resolve(
    process.cwd(),
    "../../samples/cube_20mm.stl",
  );

  let bytes: Buffer | null = null;
  try {
    bytes = await readFile(sampleSource);
  } catch {
    const fallback = path.resolve(process.cwd(), "samples/cube_20mm.stl");
    bytes = await readFile(fallback).catch(() => null);
  }
  if (!bytes) throw new Error("meshy mock: sample STL bulunamadı");

  const id = randomUUID();
  const key = `meshy/${id}.stl`;
  const fullDest = path.join(UPLOAD_DIR, key);
  await mkdir(path.dirname(fullDest), { recursive: true });

  const { writeFile } = await import("node:fs/promises");
  await writeFile(fullDest, bytes);
  void copyFile;

  return { modelFileKey: key, thumbnailUrl: null };
}

/**
 * Centralized "mark job failed and refund credits". Use this from any provider
 * (mock or real) so refund logic stays in one place.
 */
export async function markMeshyJobFailed(
  jobId: string,
  error: unknown,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);

  // Update status first; if this fails we still want to attempt refund.
  await prisma.meshyJob
    .update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorText: message.slice(0, 2000),
      },
    })
    .catch(() => void 0);

  void track(EVENTS.MESHY_JOB_FAILED, {
    jobId,
    error: message.slice(0, 500),
  });

  try {
    await refundMeshyJob(jobId);
  } catch (e) {
    // Refund infra is best-effort; log but don't propagate (caller already
    // failed the job, we don't want to mask the original error with a
    // refund-write error).
    await logError(e, {
      source: "meshy:refund",
      severity: "HIGH",
      metadata: { jobId },
    });
  }
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
      const updated = await prisma.meshyJob.update({
        where: { id: jobId },
        data: {
          status: "DONE",
          modelFileKey,
          thumbnailUrl: thumbnailUrl ?? undefined,
        },
        select: { userId: true },
      });
      void track(
        EVENTS.MESHY_JOB_DONE,
        { jobId, modelFileKey },
        { userId: updated.userId },
      );
    } catch (e) {
      await markMeshyJobFailed(jobId, e);
    }
  }, delayMs);
}
