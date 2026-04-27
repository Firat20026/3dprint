/**
 * Simple Redis-backed sliding-window rate limiter.
 *
 * Usage:
 *   const ok = await rateLimit({
 *     key: `checkout:${ip}`,
 *     limit: 10,         // max 10 requests
 *     windowSec: 60,     // per 60 seconds
 *   });
 *   if (!ok.allowed) return 429;
 *
 * Implementation: Redis INCR with EXPIRE on first write. This is a fixed-
 * window counter, not a true sliding window — but it's cheap (one round
 * trip) and good enough to stop trivial abuse. For tighter control, we
 * can switch to ZADD/ZCOUNT later without changing the API.
 *
 * Soft-fail: if Redis is unreachable, we allow the request rather than
 * locking everyone out.
 */
import "server-only";
import IORedis from "ioredis";

let redis: IORedis | null = null;

function getRedis(): IORedis {
  if (redis) return redis;
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  redis = new IORedis(url, {
    lazyConnect: false,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
  redis.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.warn("[rate-limit] redis error:", err.message);
  });
  return redis;
}

export type RateLimitInput = {
  key: string;
  limit: number;
  windowSec: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetSec: number;
};

export async function rateLimit(
  input: RateLimitInput,
): Promise<RateLimitResult> {
  const fullKey = `rl:${input.key}`;
  try {
    const r = getRedis();
    const count = await r.incr(fullKey);
    if (count === 1) {
      await r.expire(fullKey, input.windowSec);
    }
    const ttl = await r.ttl(fullKey);
    return {
      allowed: count <= input.limit,
      remaining: Math.max(0, input.limit - count),
      resetSec: ttl > 0 ? ttl : input.windowSec,
    };
  } catch {
    // Soft-fail: don't block real users if Redis is misbehaving.
    return { allowed: true, remaining: input.limit, resetSec: 0 };
  }
}

/** Extract a stable client identifier from a request — IP + optional user. */
export function clientKey(
  req: Request,
  userId?: string | null,
): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  return userId ? `u:${userId}` : `ip:${ip}`;
}

/** 429 response helper with standard headers. */
export function tooManyRequests(reset: number) {
  return new Response(
    JSON.stringify({ error: "Çok fazla istek. Biraz bekle ve tekrar dene." }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(Math.max(1, reset)),
      },
    },
  );
}
