import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?redirect=/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <Container className="py-12 animate-fade-in">
      <p className="eyebrow">Hesap</p>
      <h1 className="mt-3 h-display text-4xl md:text-5xl">
        Siparişlerim
      </h1>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-sm text-[var(--color-text-muted)]">
          Henüz sipariş yok.
        </div>
      ) : (
        <ul className="mt-10 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/account/orders/${o.id}`}
                className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-brand)]/40"
              >
                <div>
                  <p className="font-mono text-xs text-[var(--color-text-muted)]">
                    #{o.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="mt-1 text-sm">
                    {o.items.length} ürün · {new Date(o.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <OrderStatusBadge status={o.status} />
                  <p className="font-display text-lg uppercase tracking-tight">
                    ₺{Number(o.totalTRY).toFixed(2)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
