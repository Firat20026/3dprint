/**
 * Public observability API.
 *
 * Two main entry points:
 *   - track(name, properties?, ctx?)  — analytics events
 *   - logError(error, ctx)            — error capture
 *
 * Plus higher-level wrappers:
 *   - withTracking(source, handler)   — wraps an API route handler, capturing
 *                                       any thrown error to ErrorLog.
 *   - wrapAction(source, action)      — wraps a server action; same capture.
 *
 * Providers are dispatched in parallel via Promise.allSettled — a failing
 * provider never breaks the others or the calling code.
 */
import "server-only";
import { consoleProvider } from "./providers/console";
import { databaseProvider } from "./providers/database";
import { posthogProvider, isPostHogEnabled } from "./providers/posthog";
import { sentryProvider, isSentryEnabled } from "./providers/sentry";
import { readRequestContext } from "./server-context";
import type {
  EventLevel,
  EventProps,
  ErrorContext,
  LoggedError,
  ObservabilityProvider,
  TrackContext,
  TrackedEvent,
} from "./types";
import type { EventName } from "./events";

export { EVENTS } from "./events";
export type { EventName } from "./events";
export type { EventProps, EventLevel, ErrorContext, ErrorSeverity, TrackContext } from "./types";

const providers: ObservabilityProvider[] = [
  consoleProvider,
  databaseProvider,
  ...(isPostHogEnabled() ? [posthogProvider] : []),
  ...(isSentryEnabled() ? [sentryProvider] : []),
];

async function dispatch<T>(
  fn: (p: ObservabilityProvider) => Promise<T> | T,
): Promise<void> {
  await Promise.allSettled(
    providers.map(async (p) => {
      try {
        await fn(p);
      } catch {
        // never let one provider's error reach caller
      }
    }),
  );
}

/**
 * Track an analytics event. Non-blocking semantically (fire-and-forget).
 *
 * Usage:
 *   await track(EVENTS.PAYMENT_VERIFIED, { orderId, amountTRY }, { userId });
 */
export async function track(
  name: EventName | string,
  properties: EventProps = {},
  ctx: TrackContext = {},
): Promise<void> {
  const reqCtx = await readRequestContext();

  const event: TrackedEvent = {
    name,
    level: ctx.level ?? "INFO",
    userId: ctx.userId ?? null,
    sessionId: ctx.sessionId ?? null,
    properties,
    ipAddress: ctx.ipAddress ?? reqCtx.ipAddress ?? null,
    userAgent: ctx.userAgent ?? reqCtx.userAgent ?? null,
    occurredAt: new Date(),
  };

  await dispatch((p) => p.trackEvent(event));
}

/**
 * Log a captured error. Always succeeds (errors inside providers are swallowed).
 *
 * Usage:
 *   try { ... } catch (e) {
 *     await logError(e, { source: "api:checkout", severity: "HIGH", userId });
 *     throw e;  // re-throw if you want — logError doesn't consume.
 *   }
 */
export async function logError(
  error: unknown,
  ctx: ErrorContext,
): Promise<void> {
  const reqCtx = await readRequestContext();

  const errObj =
    error instanceof Error
      ? { message: error.message, stack: error.stack ?? null }
      : { message: String(error), stack: null };

  const logged: LoggedError = {
    message: errObj.message.slice(0, 4000),
    stack: errObj.stack ? errObj.stack.slice(0, 16000) : null,
    severity: ctx.severity ?? "MEDIUM",
    source: ctx.source,
    userId: ctx.userId ?? null,
    requestPath: ctx.requestPath ?? null,
    requestMethod: ctx.requestMethod ?? null,
    metadata: {
      ...(ctx.metadata ?? {}),
      ...(reqCtx.ipAddress ? { ipAddress: reqCtx.ipAddress } : {}),
      ...(reqCtx.userAgent ? { userAgent: reqCtx.userAgent } : {}),
    },
    occurredAt: new Date(),
  };

  await dispatch((p) => p.logError(logged));
}

/**
 * API route wrapper — captures any thrown error and re-throws (so Next.js
 * still returns a 500). Records the request method + path automatically.
 *
 * Usage:
 *   export const POST = withTracking("api:checkout", async (req) => { ... });
 */
type RouteHandler<T extends Request = Request> = (
  req: T,
  ctx?: { params: Record<string, string | string[]> },
) => Promise<Response> | Response;

export function withTracking<T extends Request = Request>(
  source: string,
  handler: RouteHandler<T>,
): RouteHandler<T> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      const url = (() => {
        try {
          return new URL(req.url).pathname;
        } catch {
          return null;
        }
      })();
      await logError(e, {
        source,
        severity: "HIGH",
        requestPath: url,
        requestMethod: req.method,
      });
      throw e;
    }
  };
}

/**
 * Server action wrapper — same idea as withTracking but for `"use server"`
 * actions. The action signature is preserved.
 *
 * Usage:
 *   const myAction = wrapAction("action:credit-purchase", async (formData) => { ... });
 */
export function wrapAction<Args extends unknown[], R>(
  source: string,
  action: (...args: Args) => Promise<R>,
): (...args: Args) => Promise<R> {
  return async (...args) => {
    try {
      return await action(...args);
    } catch (e) {
      await logError(e, { source, severity: "HIGH" });
      throw e;
    }
  };
}
