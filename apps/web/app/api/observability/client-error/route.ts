/**
 * POST /api/observability/client-error
 *
 * Receives client-side error reports from error.tsx / global-error.tsx and
 * persists them via logError(). No auth required (errors can fire before
 * session resolves), but we cap rate / payload size sanely.
 */
import { NextResponse } from "next/server";
import { logError } from "@/lib/observability";
import { auth } from "@/lib/auth";
import { rateLimit, clientKey, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MSG = 4000;
const MAX_STACK = 16000;

const ALLOWED_SEVERITIES = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const ALLOWED_SOURCES = new Set([
  "client:segment-error",
  "client:global-error",
]);

export async function POST(req: Request) {
  // Hard cap on client error spam — 30 / minute per IP. Bug loops on a
  // single client otherwise hammer ErrorLog and crowd out real signal.
  const rl = await rateLimit({
    key: `client-error:${clientKey(req)}`,
    limit: 30,
    windowSec: 60,
  });
  if (!rl.allowed) return tooManyRequests(rl.resetSec);

  let body: {
    message?: string;
    stack?: string;
    digest?: string;
    path?: string;
    severity?: string;
    source?: string;
  } | null;
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body || typeof body.message !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const source = body.source && ALLOWED_SOURCES.has(body.source)
    ? body.source
    : "client:unknown";
  const severity =
    body.severity && ALLOWED_SEVERITIES.has(body.severity)
      ? (body.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
      : "MEDIUM";

  const session = await auth().catch(() => null);

  await logError(
    Object.assign(new Error(body.message.slice(0, MAX_MSG)), {
      stack: body.stack ? body.stack.slice(0, MAX_STACK) : undefined,
    }),
    {
      source,
      severity,
      userId: session?.user?.id ?? null,
      requestPath: body.path ?? null,
      metadata: body.digest ? { digest: body.digest } : {},
    },
  );

  return NextResponse.json({ ok: true });
}
