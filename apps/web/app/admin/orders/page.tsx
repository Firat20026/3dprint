import Link from "next/link";
import { prisma } from "@/lib/db";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type { OrderStatus, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const STATUS_VALUES = new Set<OrderStatus>([
  "PENDING_PAYMENT",
  "PAID",
  "IN_QUEUE",
  "PRINTING",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
  "REFUNDED",
]);

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter =
    sp.status && STATUS_VALUES.has(sp.status as OrderStatus)
      ? (sp.status as OrderStatus)
      : null;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.OrderWhereInput = statusFilter
    ? { status: statusFilter }
    : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: true, user: { select: { email: true, name: true } } },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filters = [
    { label: "Tümü", value: "ALL" },
    { label: "Ödeme", value: "PENDING_PAYMENT" },
    { label: "Kuyrukta", value: "IN_QUEUE" },
    { label: "Basılıyor", value: "PRINTING" },
    { label: "Kargoda", value: "SHIPPED" },
    { label: "İptal", value: "CANCELED" },
  ];

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">
          Toplam {total} sipariş · Sayfa {page}/{totalPages}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = (statusFilter ?? "ALL") === f.value;
          return (
            <Link
              key={f.value}
              href={f.value === "ALL" ? "/admin/orders" : `/admin/orders?status=${f.value}`}
              className={
                "rounded-full border px-3 py-1 text-xs transition-colors " +
                (active
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-text)]"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]")
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">Sipariş yok.</p>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)] text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Müşteri</th>
                <th className="px-4 py-3">Ürün</th>
                <th className="px-4 py-3">Tutar</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-mono text-xs hover:text-[var(--color-brand-2)]"
                    >
                      #{o.id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p>{o.user.name ?? "—"}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{o.user.email}</p>
                  </td>
                  <td className="px-4 py-3">{o.items.length}</td>
                  <td className="px-4 py-3 font-medium">
                    ₺{Number(o.totalTRY).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                    {new Date(o.createdAt).toLocaleString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link
              href={pageUrl(page - 1)}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 hover:bg-[var(--color-surface-2)]"
            >
              ← Önceki
            </Link>
          )}
          <span className="text-[var(--color-text-muted)]">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={pageUrl(page + 1)}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 hover:bg-[var(--color-surface-2)]"
            >
              Sonraki →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
