import * as Sentry from "@sentry/nextjs";
import type { ObservabilityProvider, TrackedEvent, LoggedError } from "../types";

// Sentry is always enabled once @sentry/nextjs is installed and the config
// files (sentry.server.config.ts / sentry.edge.config.ts) are present.
export function isSentryEnabled() {
  return true;
}

export const sentryProvider: ObservabilityProvider = {
  name: "sentry",

  trackEvent(_e: TrackedEvent) {
    // Sentry isn't an analytics tool — no-op for analytics events.
    return;
  },

  logError(err: LoggedError) {
    Sentry.captureException(new Error(err.message), {
      level:
        err.severity === "CRITICAL" ? "fatal" :
        err.severity === "HIGH" ? "error" :
        err.severity === "MEDIUM" ? "warning" : "info",
      tags: { source: err.source },
      extra: {
        ...err.metadata,
        requestPath: err.requestPath,
        requestMethod: err.requestMethod,
      },
      user: err.userId ? { id: err.userId } : undefined,
    });
  },
};
