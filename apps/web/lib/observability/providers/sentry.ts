/**
 * Sentry provider stub.
 *
 * To enable: install `@sentry/nextjs`, set SENTRY_DSN, and uncomment the
 * captureException call. Errors logged via `logError()` will appear in Sentry
 * with severity → level mapping (CRITICAL → fatal, HIGH → error, etc.)
 */
import type { ObservabilityProvider, TrackedEvent, LoggedError } from "../types";

const DSN = process.env.SENTRY_DSN ?? "";

export function isSentryEnabled() {
  return DSN.length > 0;
}

export const sentryProvider: ObservabilityProvider = {
  name: "sentry",

  trackEvent(_e: TrackedEvent) {
    // Sentry isn't an analytics tool; intentionally no-op for events.
    return;
  },

  logError(_err: LoggedError) {
    // TODO: when @sentry/nextjs is installed:
    //   import * as Sentry from "@sentry/nextjs";
    //   Sentry.captureException(new Error(_err.message), {
    //     level: _err.severity === "CRITICAL" ? "fatal" : _err.severity === "HIGH" ? "error" : _err.severity === "MEDIUM" ? "warning" : "info",
    //     tags: { source: _err.source },
    //     extra: { ..._err.metadata, requestPath: _err.requestPath, requestMethod: _err.requestMethod },
    //     user: _err.userId ? { id: _err.userId } : undefined,
    //   });
    return;
  },
};
