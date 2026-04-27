/**
 * Trim observability tables to a configurable retention window.
 *
 * Usage:
 *   pnpm --filter @frint3d/web exec tsx scripts/cleanup-observability.ts [days]
 *
 * Default retention: 90 days. Pass a different number as the first arg to
 * override (e.g. `tsx scripts/cleanup-observability.ts 30`).
 *
 * Run periodically via system cron / a Docker sidecar:
 *   0 3 * * * docker compose exec -T web pnpm exec tsx scripts/cleanup-observability.ts
 *
 * Resolved error rows are kept indefinitely *only* if they're still under
 * the retention window — same cutoff applies to events. Adjust if you ever
 * want to keep critical errors longer.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const days = Number.parseInt(process.argv[2] ?? "90", 10);
  if (!Number.isFinite(days) || days < 1 || days > 3650) {
    console.error(`invalid retention days: ${process.argv[2]}`);
    process.exit(2);
  }
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  console.log(
    `[cleanup] deleting observability rows older than ${cutoff.toISOString()} (${days}d)`,
  );

  const [events, errors] = await Promise.all([
    prisma.analyticsEvent.deleteMany({
      where: { occurredAt: { lt: cutoff } },
    }),
    prisma.errorLog.deleteMany({
      where: { occurredAt: { lt: cutoff } },
    }),
  ]);

  console.log(
    `[cleanup] removed ${events.count} events, ${errors.count} error logs`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
