/**
 * Console provider — always enabled; useful for dev visibility and
 * docker-compose log inspection in production.
 */
import type { ObservabilityProvider, TrackedEvent, LoggedError } from "../types";

const COLOR = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

function severityColor(sev: LoggedError["severity"]) {
  if (sev === "CRITICAL") return COLOR.magenta;
  if (sev === "HIGH") return COLOR.red;
  if (sev === "MEDIUM") return COLOR.yellow;
  return COLOR.dim;
}

export const consoleProvider: ObservabilityProvider = {
  name: "console",

  trackEvent(e: TrackedEvent) {
    const ts = e.occurredAt.toISOString();
    // eslint-disable-next-line no-console
    console.log(
      `${COLOR.dim}[${ts}]${COLOR.reset} ${COLOR.cyan}event ${e.name}${COLOR.reset}` +
        (e.userId ? ` user=${e.userId}` : "") +
        (Object.keys(e.properties).length
          ? ` ${JSON.stringify(e.properties)}`
          : ""),
    );
  },

  logError(err: LoggedError) {
    const ts = err.occurredAt.toISOString();
    const c = severityColor(err.severity);
    // eslint-disable-next-line no-console
    console.error(
      `${COLOR.dim}[${ts}]${COLOR.reset} ${c}error[${err.severity}] ${err.source}${COLOR.reset}: ${err.message}` +
        (err.userId ? ` user=${err.userId}` : "") +
        (err.requestPath ? ` path=${err.requestMethod ?? ""} ${err.requestPath}` : "") +
        (Object.keys(err.metadata).length
          ? ` meta=${JSON.stringify(err.metadata)}`
          : "") +
        (err.stack ? `\n${err.stack}` : ""),
    );
  },
};
