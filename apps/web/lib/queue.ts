/**
 * BullMQ producer — web tarafı. Slice job enqueue eder.
 * Worker tarafındaki consumer: apps/worker/src/index.ts
 *
 * Faz 2'de `/api/slice` endpoint'i bu modülü kullanacak.
 */
import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// Singleton — Next.js dev HMR'da duplicate bağlantı önleme.
const globalForQueue = globalThis as unknown as {
  __sliceQueue?: Queue;
  __thumbQueue?: Queue;
  __sliceConnection?: IORedis;
};

function getConnection(): IORedis {
  if (!globalForQueue.__sliceConnection) {
    globalForQueue.__sliceConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return globalForQueue.__sliceConnection;
}

export function sliceQueue(): Queue<{ sliceJobId: string }> {
  if (!globalForQueue.__sliceQueue) {
    globalForQueue.__sliceQueue = new Queue("slice", {
      connection: getConnection(),
    });
  }
  return globalForQueue.__sliceQueue as Queue<{ sliceJobId: string }>;
}

export async function enqueueSlice(sliceJobId: string): Promise<void> {
  await sliceQueue().add(
    "slice",
    { sliceJobId },
    {
      jobId: sliceJobId,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
      attempts: 1,
    },
  );
}

/**
 * Thumbnail render queue — runs in the same worker process as slicing,
 * but as a separate queue so thumbnail rendering (Puppeteer) doesn't
 * stall the slicing pipeline.
 */
export function thumbnailQueue(): Queue<{ designId: string }> {
  if (!globalForQueue.__thumbQueue) {
    globalForQueue.__thumbQueue = new Queue("design-thumbnail", {
      connection: getConnection(),
    });
  }
  return globalForQueue.__thumbQueue as Queue<{ designId: string }>;
}

export async function enqueueDesignThumbnail(
  designId: string,
): Promise<void> {
  await thumbnailQueue().add(
    "render",
    { designId },
    {
      // BullMQ rejects ":" in custom job ids; use "-" so re-enqueues for the
      // same design dedupe correctly. (designId is a cuid, no ":" itself.)
      jobId: `thumb-${designId}`,
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 200 },
      attempts: 2,
      backoff: { type: "fixed", delay: 30_000 },
    },
  );
}
