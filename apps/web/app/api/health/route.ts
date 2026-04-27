/**
 * GET /api/health — readiness/liveness probe.
 *
 * Returns 200 with a small JSON body when the app can talk to its
 * dependencies. 503 if anything's broken. Intended for:
 *   - Docker compose healthcheck
 *   - Reverse proxy readiness probe
 *   - Quick "is the deploy alive?" curl from ops
 *
 * Auth-free on purpose. Doesn't expose anything sensitive — only ok/error
 * flags + uptime.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startedAt = Date.now();

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};
  let overallOk = true;

  try {
    // Cheap query — just verifies the connection pool is live.
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
    overallOk = false;
  }

  // Could add Redis here later when we want to gate health on the queue.

  const body = {
    ok: overallOk,
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    checks,
    time: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: overallOk ? 200 : 503 });
}
