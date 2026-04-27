/**
 * Resend provider stub.
 *
 * To enable:
 *   1. Install: pnpm add resend
 *   2. Set RESEND_API_KEY + RESEND_FROM_EMAIL in .env
 *   3. Uncomment the SDK calls below
 *
 * Until then this no-ops cleanly. Email is best-effort: a missing key
 * shouldn't break the calling flow.
 */
import type { NotificationProvider } from "../types";

const KEY = process.env.RESEND_API_KEY ?? "";
const FROM = process.env.RESEND_FROM_EMAIL ?? "";

export function isResendEnabled() {
  return KEY.length > 0 && FROM.length > 0;
}

export const resendProvider: NotificationProvider = {
  name: "resend",
  async send(_opts) {
    // TODO: when 'resend' is installed:
    //   const { Resend } = await import("resend");
    //   const r = new Resend(KEY);
    //   await r.emails.send({
    //     from: FROM,
    //     to: _opts.to,
    //     subject: _opts.subject,
    //     text: _opts.text,
    //     html: _opts.html,
    //   });
    return;
  },
};
