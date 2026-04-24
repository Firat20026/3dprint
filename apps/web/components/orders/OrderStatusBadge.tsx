import type { OrderStatus } from "@prisma/client";

const STYLES: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Ödeme Bekleniyor", className: "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/30" },
  PAID: { label: "Ödendi", className: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30" },
  IN_QUEUE: { label: "Baskı Kuyruğunda", className: "bg-[var(--color-brand)]/10 text-[var(--color-brand)] border-[var(--color-brand)]/30" },
  PRINTING: { label: "Basılıyor", className: "bg-[var(--color-brand-2)]/10 text-[var(--color-brand-2)] border-[var(--color-brand-2)]/30" },
  SHIPPED: { label: "Kargoda", className: "bg-[var(--color-brand-2)]/10 text-[var(--color-brand-2)] border-[var(--color-brand-2)]/30" },
  DELIVERED: { label: "Teslim", className: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30" },
  CANCELED: { label: "İptal", className: "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/30" },
  REFUNDED: { label: "İade", className: "bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] border-[var(--color-text-muted)]/30" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={
        "rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-wider " +
        s.className
      }
    >
      {s.label}
    </span>
  );
}
