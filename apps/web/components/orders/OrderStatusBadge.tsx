import type { OrderStatus } from "@prisma/client";

const STYLES: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Ödeme Bekleniyor", className: "bg-foreground/10 text-muted-foreground border-foreground/30" },
  PAID: { label: "Ödendi", className: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30" },
  IN_QUEUE: { label: "Baskı Kuyruğunda", className: "bg-primary/10 text-primary border-primary/30" },
  PRINTING: { label: "Basılıyor", className: "bg-primary/90/10 text-primary border-[var(--color-brand-2)]/30" },
  SHIPPED: { label: "Kargoda", className: "bg-primary/90/10 text-primary border-[var(--color-brand-2)]/30" },
  DELIVERED: { label: "Teslim", className: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/30" },
  CANCELED: { label: "İptal", className: "bg-destructive/10 text-destructive border-destructive/30" },
  REFUNDED: { label: "İade", className: "bg-[var(--color-text-muted)]/10 text-muted-foreground border-[var(--color-text-muted)]/30" },
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
