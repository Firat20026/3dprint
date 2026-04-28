import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

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

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
