/**
 * Public notification API.
 *
 *   await notify({
 *     to: user.email,
 *     template: "ORDER_CONFIRMED",
 *     data: { orderId, totalTRY, items },
 *   });
 *
 * Best-effort: errors inside providers are caught and logged via
 * observability — they never break the calling flow. Render errors
 * (template missing, bad payload) DO throw so they surface in dev.
 *
 * Provider selection: real providers run when their env is configured.
 * Console provider always runs (visible in docker logs / dev terminal).
 */
import "server-only";
import { logError } from "@/lib/observability";
import { render } from "./templates";
import { consoleProvider } from "./providers/console";
import { resendProvider, isResendEnabled } from "./providers/resend";
import type {
  NotificationProvider,
  NotifyInput,
  TemplateName,
} from "./types";

export { TEMPLATES } from "./types";
export type { TemplateName, TemplatePayloads } from "./types";

const providers: NotificationProvider[] = [
  consoleProvider,
  ...(isResendEnabled() ? [resendProvider] : []),
];

export async function notify<T extends TemplateName>(
  input: NotifyInput<T>,
): Promise<void> {
  if (!input.to) return;

  let rendered;
  try {
    rendered = render(input.template, input.data);
  } catch (e) {
    await logError(e, {
      source: "notifications:render",
      severity: "MEDIUM",
      metadata: { template: input.template, to: input.to },
    });
    return;
  }

  await Promise.allSettled(
    providers.map(async (p) => {
      try {
        await p.send({
          to: input.to,
          subject: rendered.subject,
          text: rendered.textBody,
          html: rendered.htmlBody,
        });
      } catch (e) {
        await logError(e, {
          source: `notifications:${p.name}`,
          severity: "LOW",
          metadata: { template: input.template, to: input.to },
        });
      }
    }),
  );
}
