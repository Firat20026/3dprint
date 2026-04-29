/**
 * Meshy AI mock provider.
 *
 * Returns a bundled sample STL after ~3 seconds. Used when MESHY_PROVIDER is
 * unset, equals "mock", or when MESHY_API_KEY is empty — i.e. local dev /
 * sandbox testing without burning real Meshy credits.
 *
 * Same shape as the real provider (`./real.ts`) — both expose
 * scheduleCompletion(jobId), and both call markMeshyJobFailed() on error.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { track, EVENTS } from "@/lib/observability";
import { notify, TEMPLATES } from "@/lib/notifications";
import { markMeshyJobFailed } from "./job-helpers";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./data/uploads";

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
  await writeFile(fullDest, bytes);

  return { modelFileKey: key, thumbnailUrl: null };
}

/**
 * Schedule a fake async completion. setTimeout-based, so jobs are lost on
 * server restart — acceptable for the dev/preview path.
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
        select: { userId: true, mode: true, prompt: true, user: { select: { email: true } } },
      });
      void track(
        EVENTS.MESHY_JOB_DONE,
        { jobId, modelFileKey },
        { userId: updated.userId },
      );
      if (updated.user?.email) {
        void notify({
          to: updated.user.email,
          template: TEMPLATES.MESHY_JOB_DONE,
          data: { jobId, mode: updated.mode, prompt: updated.prompt },
        });
      }
    } catch (e) {
      await markMeshyJobFailed(jobId, e);
    }
  }, delayMs);
}

// Backwards compat — earlier code imported markMeshyJobFailed from this module.
export { markMeshyJobFailed } from "./job-helpers";
