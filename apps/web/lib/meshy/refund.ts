/**
 * Idempotent credit refund for failed Meshy jobs.
 *
 * When a MeshyJob ends in FAILED status, we restore the credits the user paid
 * to start it. The CreditLedger has a unique (refId, reason) constraint so a
 * second concurrent call to refundMeshyJob() for the same job is rejected at
 * the DB layer rather than silently double-crediting.
 *
 * Returns:
 *   { refunded: true, amount }   — first time, credits restored
 *   { refunded: false }          — already refunded, or job has 0 credits
 */
import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { track, EVENTS } from "@/lib/observability";

export type RefundResult =
  | { refunded: true; amount: number }
  | { refunded: false; reason: "no-credits" | "already-refunded" | "job-not-failed" };

export async function refundMeshyJob(jobId: string): Promise<RefundResult> {
  const job = await prisma.meshyJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      userId: true,
      creditsCharged: true,
      status: true,
    },
  });

  if (!job) {
    return { refunded: false, reason: "job-not-failed" };
  }
  if (job.status !== "FAILED") {
    return { refunded: false, reason: "job-not-failed" };
  }
  if (job.creditsCharged <= 0) {
    return { refunded: false, reason: "no-credits" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // The (refId, reason) unique index prevents duplicate REFUND ledger
      // entries for the same MeshyJob. Insert first; if it succeeds, the
      // wallet bump is the safe follow-up inside the same transaction.
      await tx.creditLedger.create({
        data: {
          userId: job.userId,
          delta: job.creditsCharged,
          reason: "REFUND",
          refId: job.id,
          note: "AI üretim başarısız - kredi iadesi",
        },
      });
      await tx.user.update({
        where: { id: job.userId },
        data: { credits: { increment: job.creditsCharged } },
      });
    });
  } catch (e) {
    // P2002 = unique constraint violation → idempotent no-op
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { refunded: false, reason: "already-refunded" };
    }
    throw e;
  }

  void track(
    EVENTS.MESHY_REFUND_ISSUED,
    { jobId: job.id, amount: job.creditsCharged },
    { userId: job.userId },
  );
  void track(
    EVENTS.CREDITS_REFUNDED,
    { source: "meshy", refId: job.id, amount: job.creditsCharged },
    { userId: job.userId },
  );

  return { refunded: true, amount: job.creditsCharged };
}
