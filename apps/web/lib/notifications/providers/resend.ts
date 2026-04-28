import { Resend } from "resend";
import type { NotificationProvider } from "../types";

const KEY = process.env.RESEND_API_KEY ?? "";
const FROM = process.env.RESEND_FROM_EMAIL ?? "";

export function isResendEnabled() {
  return KEY.length > 0 && FROM.length > 0;
}

const client = KEY ? new Resend(KEY) : null;

export const resendProvider: NotificationProvider = {
  name: "resend",
  async send(opts) {
    if (!client || !FROM) return;
    await client.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html ?? opts.text,
    });
  },
};
