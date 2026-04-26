/**
 * Database provider — persists events + errors into AnalyticsEvent / ErrorLog
 * tables. Failures here MUST not throw (other providers should still run, and
 * the application code that emitted the event should not break).
 */
import { prisma } from "@/lib/db";
import type { ObservabilityProvider, TrackedEvent, LoggedError } from "../types";

export const databaseProvider: ObservabilityProvider = {
  name: "database",

  async trackEvent(e: TrackedEvent) {
    try {
      await prisma.analyticsEvent.create({
        data: {
          name: e.name,
          level: e.level,
          userId: e.userId,
          sessionId: e.sessionId,
          properties: e.properties as never,
          ipAddress: e.ipAddress,
          userAgent: e.userAgent,
          occurredAt: e.occurredAt,
        },
      });
    } catch (err) {
      // Last resort: don't throw, just log. Loop-prevention: don't call logError() here.
      // eslint-disable-next-line no-console
      console.error("[observability:database] trackEvent failed:", err);
    }
  },

  async logError(err: LoggedError) {
    try {
      await prisma.errorLog.create({
        data: {
          message: err.message,
          stack: err.stack,
          severity: err.severity,
          source: err.source,
          userId: err.userId,
          requestPath: err.requestPath,
          requestMethod: err.requestMethod,
          metadata: err.metadata as never,
          occurredAt: err.occurredAt,
        },
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[observability:database] logError failed:", e);
    }
  },
};
