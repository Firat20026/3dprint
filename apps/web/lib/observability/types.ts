/**
 * Shared types for the observability subsystem.
 *
 * Providers must implement ObservabilityProvider; the dispatcher in `index.ts`
 * fans out to all enabled providers in parallel via `Promise.allSettled`.
 */
import type { EventName } from "./events";

export type EventLevel = "DEBUG" | "INFO" | "WARN";
export type ErrorSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EventProps = Record<string, unknown>;

export type TrackContext = {
  userId?: string | null;
  sessionId?: string | null;
  level?: EventLevel;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type TrackedEvent = {
  name: EventName | string;
  level: EventLevel;
  userId: string | null;
  sessionId: string | null;
  properties: EventProps;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: Date;
};

export type ErrorContext = {
  source: string;
  severity?: ErrorSeverity;
  userId?: string | null;
  requestPath?: string | null;
  requestMethod?: string | null;
  metadata?: EventProps;
};

export type LoggedError = {
  message: string;
  stack: string | null;
  severity: ErrorSeverity;
  source: string;
  userId: string | null;
  requestPath: string | null;
  requestMethod: string | null;
  metadata: EventProps;
  occurredAt: Date;
};

export interface ObservabilityProvider {
  readonly name: string;
  trackEvent(event: TrackedEvent): Promise<void> | void;
  logError(error: LoggedError): Promise<void> | void;
  identifyUser?(userId: string, traits: EventProps): Promise<void> | void;
}
