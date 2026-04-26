/**
 * PostHog provider stub.
 *
 * To enable: install `posthog-node`, set POSTHOG_KEY (and optionally POSTHOG_HOST),
 * and uncomment the SDK calls below. The shape is intentionally minimal so the
 * provider can be swapped for Amplitude / Mixpanel by replacing this file.
 *
 * Until then, this no-ops cleanly.
 */
import type { ObservabilityProvider, TrackedEvent, LoggedError } from "../types";

const KEY = process.env.POSTHOG_KEY ?? "";

export function isPostHogEnabled() {
  return KEY.length > 0;
}

export const posthogProvider: ObservabilityProvider = {
  name: "posthog",

  trackEvent(_e: TrackedEvent) {
    // TODO: when posthog-node is installed:
    //   const ph = await getClient();
    //   ph.capture({ distinctId: _e.userId ?? "anonymous", event: _e.name, properties: _e.properties });
    return;
  },

  logError(_err: LoggedError) {
    // PostHog supports error tracking via $exception event but we typically
    // route errors to Sentry instead. Keep it as no-op here.
    return;
  },
};
