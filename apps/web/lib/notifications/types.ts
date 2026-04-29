/**
 * Shared types for email notifications.
 *
 * Templates are typed by name; payloads carry only what the template needs.
 * Adding a new email = (1) add to TEMPLATES, (2) add render() case in
 * `templates.ts`, (3) call notify() from the relevant flow.
 */

export const TEMPLATES = {
  ORDER_CONFIRMED: "ORDER_CONFIRMED",
  ORDER_SHIPPED: "ORDER_SHIPPED",
  CREDIT_PURCHASE_COMPLETED: "CREDIT_PURCHASE_COMPLETED",
  DESIGN_APPROVED: "DESIGN_APPROVED",
  DESIGN_REJECTED: "DESIGN_REJECTED",
  MESHY_REFUND_ISSUED: "MESHY_REFUND_ISSUED",
  PASSWORD_RESET: "PASSWORD_RESET",
  TEST_EMAIL: "TEST_EMAIL",
  MESHY_JOB_DONE: "MESHY_JOB_DONE",
  ORDER_PAYMENT_FAILED: "ORDER_PAYMENT_FAILED",
  CREDIT_PAYMENT_FAILED: "CREDIT_PAYMENT_FAILED",
} as const;

export type TemplateName = (typeof TEMPLATES)[keyof typeof TEMPLATES];

export type TemplatePayloads = {
  ORDER_CONFIRMED: {
    orderId: string;
    totalTRY: number;
    items: Array<{ title: string; quantity: number }>;
  };
  ORDER_SHIPPED: {
    orderId: string;
    cargoCarrier?: string | null;
    cargoTrackingNo?: string | null;
  };
  CREDIT_PURCHASE_COMPLETED: {
    purchaseId: string;
    credits: number;
    priceTRY: number;
  };
  DESIGN_APPROVED: {
    designTitle: string;
    designSlug: string;
  };
  DESIGN_REJECTED: {
    designTitle: string;
    rejectionReason: string;
  };
  MESHY_REFUND_ISSUED: {
    jobId: string;
    creditsRefunded: number;
    error: string;
  };
  PASSWORD_RESET: {
    resetUrl: string;
    expiresInMinutes: number;
  };
  TEST_EMAIL: {
    sentAt: string;
  };
  MESHY_JOB_DONE: {
    jobId: string;
    mode: "TEXT" | "IMAGE";
    prompt: string | null;
  };
  ORDER_PAYMENT_FAILED: {
    orderId: string;
    reason: string;
  };
  CREDIT_PAYMENT_FAILED: {
    purchaseId: string;
    credits: number;
    priceTRY: number;
  };
};

export type RenderedEmail = {
  subject: string;
  textBody: string;
  htmlBody?: string;
};

export type NotifyInput<T extends TemplateName> = {
  to: string;
  template: T;
  data: TemplatePayloads[T];
};

export interface NotificationProvider {
  readonly name: string;
  send(opts: { to: string; subject: string; text: string; html?: string }): Promise<void>;
}
