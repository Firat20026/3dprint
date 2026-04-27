/**
 * Enqueue a thumbnail-render job for every Design that doesn't have one yet.
 *
 * Usage:
 *   pnpm --filter @frint3d/web exec tsx scripts/backfill-thumbnails.ts [batchSize]
 *
 * Default batch size: 50. The thumbnail queue is rate-limited by the worker
 * (concurrency 1) so even a large batch trickles through safely.
 *
 * Suggested cron — every 6 hours, picks up anything missed:
 *   0 *\/6 * * * docker compose exec -T web pnpm exec tsx scripts/backfill-thumbnails.ts
 *
 * Newly-uploaded designs are auto-enqueued at upload time; this script is
 * the safety net for older designs and any that had a render failure.
 */
import { PrismaClient } from "@prisma/client";
import { enqueueDesignThumbnail } from "../lib/queue";

const prisma = new PrismaClient();

async function main() {
  const batch = Number.parseInt(process.argv[2] ?? "50", 10);
  if (!Number.isFinite(batch) || batch < 1 || batch > 500) {
    console.error(`invalid batch size: ${process.argv[2]}`);
    process.exit(2);
  }

  // Only published / pending-review / draft designs — archived/rejected ones
  // don't need a thumbnail, and the catalog never shows them anyway.
  const designs = await prisma.design.findMany({
    where: {
      thumbnailUrl: null,
      status: { in: ["DRAFT", "PENDING_REVIEW", "PUBLISHED"] },
    },
    orderBy: { createdAt: "asc" },
    take: batch,
    select: { id: true },
  });

  console.log(`[backfill-thumbnails] enqueueing ${designs.length} designs`);
  for (const d of designs) {
    await enqueueDesignThumbnail(d.id).catch((e) => {
      console.error(`[backfill-thumbnails] enqueue failed ${d.id}:`, e);
    });
  }
  console.log(`[backfill-thumbnails] done`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
