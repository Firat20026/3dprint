/**
 * One-shot smoke test: create a SliceJob from an existing design's modelFileKey
 * and enqueue it, so we can see the worker pick it up and complete.
 *
 *   tsx --env-file=.env src/smoke.ts
 *
 * Expects: postgres + redis running, at least one Design + Material + PrintProfile seeded.
 */
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "./db.js";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

async function main() {
  const design = await prisma.design.findFirst({ where: { status: "PUBLISHED" } });
  const material = await prisma.material.findFirst({ where: { isActive: true } });
  const profile = await prisma.printProfile.findFirst();

  if (!design || !material || !profile) {
    throw new Error("seed data missing — need a published design + material + profile");
  }

  const job = await prisma.sliceJob.create({
    data: {
      sourceFileKey: design.modelFileKey,
      fileHash: `smoke-${Date.now()}`,
      materialId: material.id,
      profileId: profile.id,
      designId: design.id,
      status: "QUEUED",
    },
  });

  const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
  const queue = new Queue("slice", { connection });
  await queue.add("slice", { sliceJobId: job.id }, { removeOnComplete: true });
  await queue.close();
  await connection.quit();

  console.log(`enqueued sliceJob=${job.id} (design=${design.slug} material=${material.name} profile=${profile.name})`);
  console.log("watch worker logs — poll DB with: SELECT id, status, filament_grams, print_seconds, unit_price_try FROM \"SliceJob\" WHERE id='" + job.id + "';");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
