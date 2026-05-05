import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Container } from "@/components/ui/container";
import { SubmitButton } from "@/components/ui/submit-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { trackingUrlFor } from "@/lib/cargo";
import { notify, TEMPLATES } from "@/lib/notifications";
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

async function cancelOrder(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const id = String(formData.get("orderId") ?? "");
  if (!id) throw new Error("Sipariş ID eksik");

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: { user: { select: { email: true } } },
  });
  if (!order) throw new Error("Sipariş bulunamadı");
  if (order.status !== "PENDING_PAYMENT") {
    throw new Error("Yalnızca ödeme bekleyen siparişler iptal edilebilir");
  }

  await prisma.order.update({
    where: { id },
    data: { status: "CANCELED", canceledAt: new Date() },
  });

  if (order.user.email) {
    void notify({
      to: order.user.email,
      template: TEMPLATES.ORDER_CANCELED,
      data: { orderId: id },
    });
  }

  revalidatePath(`/account/orders/${id}`);
  revalidatePath("/account/orders");
}

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
  printingStartedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  canceledAt: Date | null;
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
        date: order.canceledAt,
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
      date: order.printingStartedAt,
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
      date: order.deliveredAt,
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
        className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        ← Tüm Siparişler
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="h-display text-3xl md:text-4xl">
          Sipariş #{order.id.slice(-8).toUpperCase()}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground/70">
        Oluşturuldu: {order.createdAt.toLocaleString("tr-TR")}
      </p>

      {paid === "1" && order.status !== "PENDING_PAYMENT" && order.status !== "CANCELED" && (
        <div className="mt-6 rounded-xl border border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/10 p-5 text-sm text-[hsl(var(--success))]">
          ✓ Ödeme başarılı! Siparişin baskı kuyruğuna alındı. Durumu buradan
          takip edebilirsin.
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-8">
          {order.status !== "PENDING_PAYMENT" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
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
            <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
              Ürünler
            </h2>
            <ul className="mt-3 space-y-3">
              {order.items.map((it) => {
                const snap = (it.snapshot ?? {}) as OrderItemSnapshot;
                return (
                  <li
                    key={it.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4"
                  >
                    <div>
                      <p className="font-medium">{snap.title ?? "Ürün"}</p>
                      <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {snap.material?.colorHex && (
                          <span
                            className="inline-block size-3 rounded-full border border-white/10"
                            style={{ backgroundColor: snap.material.colorHex }}
                          />
                        )}
                        {snap.material?.name} · {snap.profile?.name}
                        {snap.filamentGrams && (
                          <span className="text-muted-foreground/70">
                            · {snap.filamentGrams.toFixed(1)}g
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg uppercase tracking-tight">
                        ₺{Number(it.totalPriceTRY).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
              Özet
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Ara toplam" value={`₺${Number(order.subtotalTRY).toFixed(2)}`} />
              <Row label="Kargo" value={`₺${Number(order.shippingTRY).toFixed(2)}`} />
              {Number(order.discountTRY) > 0 && (
                <div className="flex justify-between text-[hsl(var(--success))]">
                  <dt>
                    {order.couponCode ? `Kupon (${order.couponCode})` : "İndirim"}
                  </dt>
                  <dd className="font-medium">−₺{Number(order.discountTRY).toFixed(2)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <dt className="uppercase tracking-wider">Toplam</dt>
                <dd className="font-display text-xl uppercase tracking-tight">
                  ₺{Number(order.totalTRY).toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 text-sm">
            <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
              Teslimat
            </h2>
            <p className="mt-3 font-medium">{shipping.fullName}</p>
            <p className="text-muted-foreground">{shipping.phone}</p>
            <p className="mt-2 text-muted-foreground">
              {shipping.address}, {shipping.district}, {shipping.city}
              {shipping.zipCode ? ` ${shipping.zipCode}` : ""}
            </p>
            {shipping.notes && (
              <p className="mt-3 rounded-lg bg-secondary p-3 text-xs">
                {shipping.notes}
              </p>
            )}
          </div>

          {/* Cancel — only available before payment is confirmed */}
          {order.status === "PENDING_PAYMENT" && (
            <div className="rounded-xl border border-destructive/30 bg-card p-5">
              <h2 className="font-display text-sm uppercase tracking-wider text-destructive">
                Siparişi İptal Et
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Ödeme henüz alınmadı. İptal etmek ücretsiz.
              </p>
              <form action={cancelOrder} className="mt-3">
                <input type="hidden" name="orderId" value={order.id} />
                <SubmitButton
                  size="sm"
                  variant="ghost"
                  pendingLabel="İptal ediliyor..."
                  style={{ color: "var(--color-danger)" }}
                >
                  Siparişi İptal Et
                </SubmitButton>
              </form>
            </div>
          )}
          {order.status === "IN_QUEUE" && (
            <div className="rounded-xl border border-border bg-card p-5 text-sm">
              <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
                İptal talebi
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Siparişin ödendi ve baskı kuyruğunda. İptal için bizimle iletişime geç:
              </p>
              <a
                href="https://wa.me/905555555555"
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium font-medium text-foreground hover:underline"
              >
                WhatsApp ile yaz →
              </a>
            </div>
          )}

          {order.cargoTrackingNo && (
            <div className="rounded-xl border border-border bg-card p-5 text-sm">
              <h2 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
                Kargo Takibi
              </h2>
              <p className="mt-3 font-medium">{cargo.display}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {order.cargoTrackingNo}
              </p>
              {cargo.url ? (
                <a
                  href={cargo.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium font-medium text-foreground hover:underline"
                >
                  Kargo şirketinden takip et →
                </a>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground/70">
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
      ? "border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
      : state === "current"
        ? "border-primary/40 bg-primary/10 text-primary"
        : "border-border bg-secondary text-muted-foreground/70";

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
              ? "text-muted-foreground/70"
              : "text-foreground")
          }
        >
          {step.label}
        </p>
        <p className="text-xs text-muted-foreground">
          {step.description}
          {step.date && (
            <span className="ml-2 text-muted-foreground/70">
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
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
