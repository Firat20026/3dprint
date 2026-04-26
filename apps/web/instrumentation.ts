/**
 * Next.js global instrumentation hook.
 *
 * Runs once when the server boots (Node.js or Edge runtime). We use it to:
 *   - Wire up an unhandled-error capture hook (server side) that funnels into
 *     our observability ErrorLog.
 *   - Reserve a place for future SDK init (Sentry.init, PostHog.init, etc.)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logError } = await import("@/lib/observability");

    process.on("unhandledRejection", (reason) => {
      void logError(reason, {
        source: "node:unhandledRejection",
        severity: "CRITICAL",
      });
    });

    process.on("uncaughtException", (err) => {
      void logError(err, {
        source: "node:uncaughtException",
        severity: "CRITICAL",
      });
    });
  }
}
