/**
 * Fail SliceJobs / MeshyJobs that have been RUNNING for too long.
 *
 * Worker crash, OOM kill, or external-API hang can leave a job stuck in
 * RUNNING forever — the user never gets their result *and* (for Meshy)
 * never gets a credit refund. This script flips long-RUNNING jobs to
 * FAILED and (for Meshy) issues the matching refund inline.
 *
 * Usage:
 *   pnpm --filter @frint3d/web exec tsx scripts/fail-stuck-jobs.ts [maxRunMin]
 *
 * Default cutoff: 30 min. Run periodically via system cron:
 *   *\/15 * * * * docker compose exec -T web pnpm exec tsx scripts/fail-stuck-jobs.ts
 *
 * The refund block here mirrors lib/meshy/refund.ts — kept inline because
 * tsx running outside Next.js can't import server-only modules.
 */
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function refundMeshyJobInline(jobId: string): Promise<void> {
  const job = await prisma.meshyJob.findUnique({
    where: { id: jobId },
    select: { id: true, userId: true, creditsCharged: true, status: true },
  });
  if (!job || job.status !== "FAILED" || job.creditsCharged <= 0) return;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.creditLedger.create({
        data: {
          userId: job.userId,
          delta: job.creditsCharged,
          reason: "REFUND",
          refId: job.id,
          note: "AI üretim takılı kaldı - otomatik iade",
        },
      });
      await tx.user.update({
        where: { id: job.userId },
        data: { credits: { increment: job.creditsCharged } },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // Already refunded — idempotent no-op.
      return;
    }
    throw e;
  }
}

async function main() {
  const minutes = Number.parseInt(process.argv[2] ?? "30", 10);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) {
    console.error(`invalid minutes: ${process.argv[2]}`);
    process.exit(2);
  }
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  console.log(
    `[stuck-jobs] failing RUNNING jobs older than ${cutoff.toISOString()} (${minutes} min)`,
  );

  const sliceFailed = await prisma.sliceJob.updateMany({
    where: {
      status: "RUNNING",
      OR: [
        { startedAt: { lt: cutoff } },
        { AND: [{ startedAt: null }, { updatedAt: { lt: cutoff } }] },
      ],
    },
    data: {
      status: "FAILED",
      errorText: `auto-failed: stuck in RUNNING for >${minutes} min`,
      finishedAt: new Date(),
    },
  });

  const stuckMeshy = await prisma.meshyJob.findMany({
    where: {
      status: { in: ["PENDING", "RUNNING"] },
      updatedAt: { lt: cutoff },
    },
    select: { id: true },
  });
  for (const job of stuckMeshy) {
    await prisma.meshyJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorText: `auto-failed: stuck for >${minutes} min`,
      },
    });
  }

  console.log(
    `[stuck-jobs] flipped ${sliceFailed.count} slice jobs, ${stuckMeshy.length} meshy jobs`,
  );

  let refunded = 0;
  for (const job of stuckMeshy) {
    try {
      await refundMeshyJobInline(job.id);
      refunded++;
    } catch (e) {
      console.error(`[stuck-jobs] refund failed for ${job.id}:`, e);
    }
  }
  if (refunded > 0) {
    console.log(`[stuck-jobs] refunded ${refunded}/${stuckMeshy.length} meshy jobs`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
