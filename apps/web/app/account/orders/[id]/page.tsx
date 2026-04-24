import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

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

      {paid === "1" && order.status !== "PENDING_PAYMENT" && order.status !== "CANCELED" && (
        <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 p-5 text-sm text-[var(--color-success)]">
          Ödeme başarılı! Siparişin baskı kuyruğuna alındı. Durumu buradan takip edebilirsin.
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section>
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
                Kargo
              </h2>
              <p className="mt-3">{order.cargoCarrier ?? "—"}</p>
              <p className="font-mono text-xs text-[var(--color-text-muted)]">
                {order.cargoTrackingNo}
              </p>
            </div>
          )}
        </aside>
      </div>
    </Container>
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
