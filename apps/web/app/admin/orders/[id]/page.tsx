import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderActions } from "@/components/admin/OrderActions";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type OrderItemSnapshot = {
  title?: string;
  material?: { name?: string; colorHex?: string };
  profile?: { name?: string };
  filamentGrams?: number;
  printSeconds?: number;
};

type ShippingSnapshot = {
  fullName?: string;
  phone?: string;
  email?: string;
  city?: string;
  district?: string;
  address?: string;
  zipCode?: string;
  notes?: string;
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { sliceJob: true, design: true } },
      user: { select: { email: true, name: true } },
    },
  });
  if (!order) notFound();

  const shipping = (order.shippingSnapshot ?? {}) as ShippingSnapshot;

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        ← Siparişler
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <h2 className="font-display text-2xl uppercase tracking-tight">
          #{order.id.slice(-8).toUpperCase()}
        </h2>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-3">
          {order.items.map((it) => {
            const snap = (it.snapshot ?? {}) as OrderItemSnapshot;
            return (
              <div
                key={it.id}
                className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{snap.title ?? "Ürün"}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {snap.material?.name} · {snap.profile?.name}
                      {snap.filamentGrams && ` · ${snap.filamentGrams.toFixed(1)}g`}
                      {snap.printSeconds && ` · ${Math.round(snap.printSeconds / 60)}dk`}
                    </p>
                    {it.sliceJob && (
                      <p className="mt-2 font-mono text-[10px] text-[var(--color-text-subtle)]">
                        slice:{it.sliceJob.id.slice(-8)} · file:{it.sliceJob.sourceFileKey}
                      </p>
                    )}
                    {it.design && (
                      <Link
                        href={`/designs/${it.design.slug}`}
                        className="mt-2 block text-[10px] uppercase tracking-wider text-[var(--color-brand-2)] hover:underline"
                      >
                        Tasarım sayfası →
                      </Link>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg uppercase tracking-tight">
                      ₺{Number(it.totalPriceTRY).toFixed(2)}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">×{it.quantity}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <aside className="space-y-4">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
            <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              Özet
            </h3>
            <dl className="mt-3 space-y-1">
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">Ara toplam</dt>
                <dd>₺{Number(order.subtotalTRY).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-muted)]">Kargo</dt>
                <dd>₺{Number(order.shippingTRY).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between border-t border-[var(--color-border)] pt-2 font-medium">
                <dt>Toplam</dt>
                <dd>₺{Number(order.totalTRY).toFixed(2)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
            <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              Müşteri
            </h3>
            <p className="mt-2">{order.user.name ?? "—"}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{order.user.email}</p>
            <p className="mt-3 text-xs">{shipping.phone}</p>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              {shipping.address}, {shipping.district}, {shipping.city}
            </p>
            {shipping.notes && (
              <p className="mt-3 rounded-[var(--radius-button)] bg-[var(--color-surface-2)] p-2 text-xs">
                {shipping.notes}
              </p>
            )}
          </div>

          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
            <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              İşlemler
            </h3>
            <OrderActions
              orderId={order.id}
              status={order.status}
              cargoTrackingNo={order.cargoTrackingNo}
              cargoCarrier={order.cargoCarrier}
            />
          </div>

          {/* Timeline */}
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
            <h3 className="mb-4 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              Sipariş Zaman Çizelgesi
            </h3>
            <OrderTimeline order={order} />
          </div>

          {order.iyzicoPaymentId && (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs">
              <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                iyzico
              </h3>
              <p className="mt-2 font-mono">Payment: {order.iyzicoPaymentId}</p>
              {order.paidAt && (
                <p className="mt-1 text-[var(--color-text-muted)]">
                  Ödendi: {new Date(order.paidAt).toLocaleString("tr-TR")}
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

const STATUS_ORDER: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "IN_QUEUE",
  "PRINTING",
  "SHIPPED",
  "DELIVERED",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Sipariş oluşturuldu",
  PAID:            "Ödeme alındı",
  IN_QUEUE:        "Kuyruğa alındı",
  PRINTING:        "Baskı başladı",
  SHIPPED:         "Kargoya verildi",
  DELIVERED:       "Teslim edildi",
  CANCELED:        "İptal edildi",
  REFUNDED:        "İade edildi",
};

const STATUS_HINT: Partial<Record<OrderStatus, string>> = {
  PENDING_PAYMENT: "İyzico ödemesi bekleniyor",
  PAID:            "Ödeme başarıyla doğrulandı",
  IN_QUEUE:        "Yazıcı kuyruğunda bekliyor",
  PRINTING:        "Snapmaker U1 yazdırıyor",
  SHIPPED:         "Kargo firmasına teslim edildi",
  DELIVERED:       "Müşteriye ulaştı",
};

type OrderForTimeline = {
  status: OrderStatus;
  createdAt: Date;
  paidAt: Date | null;
  printingStartedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  canceledAt: Date | null;
  cargoTrackingNo: string | null;
  cargoCarrier: string | null;
};

function OrderTimeline({ order }: { order: OrderForTimeline }) {
  const isCanceled = order.status === "CANCELED" || order.status === "REFUNDED";

  if (isCanceled) {
    return (
      <div className="flex items-center gap-2 text-[var(--color-danger)]">
        <Circle className="size-4 shrink-0" />
        <div>
          <p className="text-sm font-medium">{STATUS_LABELS[order.status]}</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {new Date(order.createdAt).toLocaleString("tr-TR")}
          </p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(order.status);

  // Timestamp map — best-effort from the fields we have
  const timestamps: Partial<Record<OrderStatus, Date>> = {
    PENDING_PAYMENT: order.createdAt,
    PAID: order.paidAt ?? undefined,
    PRINTING: order.printingStartedAt ?? undefined,
    SHIPPED: order.shippedAt ?? undefined,
    DELIVERED: order.deliveredAt ?? undefined,
  };

  return (
    <ol className="space-y-0">
      {STATUS_ORDER.map((s, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        const ts = timestamps[s];

        return (
          <li key={s} className="relative flex gap-3 pb-4 last:pb-0">
            {/* Vertical line */}
            {i < STATUS_ORDER.length - 1 && (
              <div
                className={
                  "absolute left-[7px] top-5 h-full w-px " +
                  (done && i < currentIdx
                    ? "bg-[var(--color-brand)]/40"
                    : "bg-[var(--color-border)]")
                }
              />
            )}

            {/* Icon */}
            <div className="relative z-10 mt-0.5 shrink-0">
              {done ? (
                active ? (
                  <span className="flex size-4 items-center justify-center rounded-full bg-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/30">
                    <Clock className="size-2.5 text-white" />
                  </span>
                ) : (
                  <CheckCircle2 className="size-4 text-[var(--color-brand-2)]" />
                )
              ) : (
                <Circle className="size-4 text-[var(--color-border)]" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className={
                "text-sm font-medium " +
                (done ? "text-[var(--color-text)]" : "text-[var(--color-text-subtle)]")
              }>
                {STATUS_LABELS[s]}
              </p>
              {done && STATUS_HINT[s] && (
                <p className="text-xs text-[var(--color-text-muted)]">{STATUS_HINT[s]}</p>
              )}
              {s === "SHIPPED" && done && order.cargoTrackingNo && (
                <p className="mt-0.5 font-mono text-xs text-[var(--color-brand-2)]">
                  {order.cargoCarrier ? `${order.cargoCarrier} · ` : ""}{order.cargoTrackingNo}
                </p>
              )}
              {ts && (
                <p className="mt-0.5 text-[10px] text-[var(--color-text-subtle)]">
                  {ts.toLocaleString("tr-TR")}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
