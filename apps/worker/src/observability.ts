/**
 * Worker-side observability — minimal subset of @/lib/observability tailored
 * for a Node-only environment with no Next.js request context.
 *
 * Same DB tables (AnalyticsEvent, ErrorLog) as the web app so the admin
 * dashboard sees a unified stream.
 */
import { prisma } from "./db.js";

type Json = Record<string, unknown>;
type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export async function track(
  name: string,
  properties: Json = {},
  opts: { userId?: string | null; level?: "DEBUG" | "INFO" | "WARN" } = {},
): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(
    `[event] ${name}` +
      (opts.userId ? ` user=${opts.userId}` : "") +
      (Object.keys(properties).length ? ` ${JSON.stringify(properties)}` : ""),
  );
  try {
    await prisma.analyticsEvent.create({
      data: {
        name,
        level: opts.level ?? "INFO",
        userId: opts.userId ?? null,
        properties: properties as never,
        occurredAt: new Date(),
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[observability:worker] track persistence failed:", e);
  }
}

export async function logError(
  err: unknown,
  ctx: {
    source: string;
    severity?: Severity;
    userId?: string | null;
    metadata?: Json;
  },
): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack ?? null : null;
  // eslint-disable-next-line no-console
  console.error(
    `[error:${ctx.severity ?? "MEDIUM"}] ${ctx.source}: ${message}` +
      (stack ? `\n${stack}` : ""),
  );
  try {
    await prisma.errorLog.create({
      data: {
        message: message.slice(0, 4000),
        stack: stack ? stack.slice(0, 16000) : null,
        severity: ctx.severity ?? "MEDIUM",
        source: ctx.source,
        userId: ctx.userId ?? null,
        metadata: (ctx.metadata ?? {}) as never,
        occurredAt: new Date(),
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[observability:worker] logError persistence failed:", e);
  }
}
