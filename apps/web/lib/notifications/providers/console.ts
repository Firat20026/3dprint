/**
 * Always-on console "send" provider — useful for development and as a
 * fallback when no real provider is configured. The real Resend/SendGrid
 * adapter (see siblings) takes priority when its env is set.
 */
import type { NotificationProvider } from "../types";

export const consoleProvider: NotificationProvider = {
  name: "console",
  async send(opts) {
    // eslint-disable-next-line no-console
    console.log(
      `[notify:console] to=${opts.to} subject="${opts.subject}"\n${opts.text}`,
    );
  },
};
