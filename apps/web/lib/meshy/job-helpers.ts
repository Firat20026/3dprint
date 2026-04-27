/**
 * Shared "mark job failed + refund credits" helper.
 *
 * Both the mock provider and the real Meshy provider call this when a job
 * ends in failure, so the refund-write logic lives in exactly one place.
 */
import "server-only";
import { prisma } from "@/lib/db";
import { refundMeshyJob } from "@/lib/meshy/refund";
import { track, logError, EVENTS } from "@/lib/observability";

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
    // failed the job; we don't want to mask the original error with a
    // refund-write error).
    await logError(e, {
      source: "meshy:refund",
      severity: "HIGH",
      metadata: { jobId },
    });
  }
}
