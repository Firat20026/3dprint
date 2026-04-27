import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { trackingUrlFor } from "@/lib/cargo";
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Ban,
  Sparkles,
} from "lucide-react";
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

type TimelineStep = {
  key: OrderStatus | "CREATED";
  label: string;
  description: string;
  date: Date | null;
  icon: React.ComponentType<{ className?: string }>;
  state: "done" | "current" | "future" | "skipped";
};

function buildTimeline(order: {
  status: OrderStatus;
  createdAt: Date;
  paidAt: Date | null;
  shippedAt: Date | null;
}): TimelineStep[] {
  if (order.status === "CANCELED") {
    return [
      {
        key: "CREATED",
        label: "Sipariş oluşturuldu",
        description: "Ödeme bekleniyordu",
        date: order.createdAt,
        icon: Sparkles,
        state: "done",
      },
      {
        key: "CANCELED",
        label: "İptal edildi",
        description: "Sipariş iptal edildi",
        date: null,
        icon: Ban,
        state: "current",
      },
    ];
  }

  const reached: Record<OrderStatus, number> = {
    PENDING_PAYMENT: 0,
    PAID: 1,
    IN_QUEUE: 2,
    PRINTING: 3,
    SHIPPED: 4,
    DELIVERED: 5,
    CANCELED: -1,
    REFUNDED: -1,
  };
  const idx = reached[order.status];

  const stateOf = (n: number): TimelineStep["state"] => {
    if (n < idx) return "done";
    if (n === idx) return "current";
    return "future";
  };

  return [
    {
      key: "CREATED",
      label: "Sipariş oluşturuldu",
      description: "Ödeme alındı",
      date: order.paidAt ?? order.createdAt,
      icon: Sparkles,
      state: "done",
    },
    {
      key: "IN_QUEUE",
      label: "Baskı kuyruğunda",
      description: "Üretim sırası bekleniyor",
      date: null,
      icon: Clock,
      state: stateOf(2),
    },
    {
      key: "PRINTING",
      label: "Baskıda",
      description: "Yazıcılarımızda üretiliyor",
      date: null,
      icon: Package,
      state: stateOf(3),
    },
    {
      key: "SHIPPED",
      label: "Kargoda",
      description: "Sana doğru yola çıktı",
      date: order.shippedAt,
      icon: Truck,
      state: stateOf(4),
    },
    {
      key: "DELIVERED",
      label: "Teslim edildi",
      description: "Siparişin elinde",
      date: null,
      icon: CheckCircle2,
      state: stateOf(5),
    },
  ];
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const { paid } = await searchParams;

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true },
  });
  if (!order) notFound();

  const shipping = (order.shippingSnapshot ?? {}) as ShippingSnapshot;
  const timeline = buildTimeline(order);
  const cargo = trackingUrlFor(order.cargoCarrier, order.cargoTrackingNo);

  return (
    <Container className="py-12">
      <Link
        href="/account/orders"
        className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        ← Tüm Siparişler
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="h-display text-3xl md:text-4xl">
          Sipariş #{order.id.slice(-8).toUpperCase()}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
        Oluşturuldu: {order.createdAt.toLocaleString("tr-TR")}
      </p>

      {paid === "1" && order.status !== "PENDING_PAYMENT" && order.status !== "CANCELED" && (
        <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 p-5 text-sm text-[var(--color-success)]">
          ✓ Ödeme başarılı! Siparişin baskı kuyruğuna alındı. Durumu buradan
          takip edebilirsin.
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-8">
          {order.status !== "PENDING_PAYMENT" && (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="font-display text-sm uppercase tracking-wider text-[var(--color-text-muted)]">
                Durum
              </h2>
              <ol className="mt-4 space-y-3">
                {timeline.map((step) => (
                  <TimelineRow key={step.key} step={step} />
                ))}
              </ol>
            </div>
          )}

          <div>
            <h2 className="font-display text-sm uppercase tracking-wider text-[var(--color-text-muted)]">
              Ürünler
            </h2>
            <ul className="mt-3 space-y-3">
              {order.items.map((it) => {
                const snap = (it.snapshot ?? {}) as OrderItemSnapshot;
                return (
                  <li
                    key={it.id}
                    className="flex items-start justify-between gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                  >
                    <div>
                      <p className="font-medium">{snap.title ?? "Ürün"}</p>
                      <p className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        {snap.material?.colorHex && (
                          <span
                            className="inline-block size-3 rounded-full border border-white/10"
                            style={{ backgroundColor: snap.material.colorHex }}
                          />
                        )}
                        {snap.material?.name} · {snap.profile?.name}
                        {snap.filamentGrams && (
                          <span className="text-[var(--color-text-subtle)]">
                            · {snap.filamentGrams.toFixed(1)}g
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg uppercase tracking-tight">
                        ₺{Number(it.totalPriceTRY).toFixed(2)}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        ₺{Number(it.unitPriceTRY).toFixed(2)} × {it.quantity}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h2 className="font-display text-sm uppercase tracking-wider text-[var(--color-text-muted)]">
              Özet
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Ara toplam" value={`₺${Number(order.subtotalTRY).toFixed(2)}`} />
              <Row label="Kargo" value={`₺${Number(order.shippingTRY).toFixed(2)}`} />
              <div className="flex justify-between border-t border-[var(--color-border)] pt-3 text-base">
                <dt className="uppercase tracking-wider">Toplam</dt>
                <dd className="font-display text-xl uppercase tracking-tight">
                  ₺{Number(order.totalTRY).toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm">
            <h2 className="font-display text-sm uppercase tracking-wider text-[var(--color-text-muted)]">
              Teslimat
            </h2>
            <p className="mt-3 font-medium">{shipping.fullName}</p>
            <p className="text-[var(--color-text-muted)]">{shipping.phone}</p>
            <p className="mt-2 text-[var(--color-text-muted)]">
              {shipping.address}, {shipping.district}, {shipping.city}
              {shipping.zipCode ? ` ${shipping.zipCode}` : ""}
            </p>
            {shipping.notes && (
              <p className="mt-3 rounded-[var(--radius-button)] bg-[var(--color-surface-2)] p-3 text-xs">
                {shipping.notes}
              </p>
            )}
          </div>

          {order.cargoTrackingNo && (
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm">
              <h2 className="font-display text-sm uppercase tracking-wider text-[var(--color-text-muted)]">
                Kargo Takibi
              </h2>
              <p className="mt-3 font-medium">{cargo.display}</p>
              <p className="font-mono text-xs text-[var(--color-text-muted)]">
                {order.cargoTrackingNo}
              </p>
              {cargo.url ? (
                <a
                  href={cargo.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand-2)] hover:underline"
                >
                  Kargo şirketinden takip et →
                </a>
              ) : (
                <p className="mt-2 text-xs text-[var(--color-text-subtle)]">
                  Kargo şirketinin web sitesinden takip numarası ile sorgula.
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </Container>
  );
}

function TimelineRow({ step }: { step: TimelineStep }) {
  const { state, icon: Icon } = step;
  const tone =
    state === "done"
      ? "border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-[var(--color-success)]"
      : state === "current"
        ? "border-[var(--color-brand)]/40 bg-[var(--color-brand)]/10 text-[var(--color-brand-2)]"
        : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-subtle)]";

  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border ${tone}`}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="flex-1">
        <p
          className={
            "text-sm font-medium " +
            (state === "future"
              ? "text-[var(--color-text-subtle)]"
              : "text-[var(--color-text)]")
          }
        >
          {step.label}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {step.description}
          {step.date && (
            <span className="ml-2 text-[var(--color-text-subtle)]">
              · {step.date.toLocaleString("tr-TR")}
            </span>
          )}
        </p>
      </div>
    </li>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
