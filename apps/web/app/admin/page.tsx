import Link from "next/link";
import { prisma } from "@/lib/db";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { ShoppingBag, TrendingUp, Layers, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrders,
    monthRevenueAgg,
    totalDesigns,
    activeMaterials,
    pendingDesignsCount,
    lowStockMaterials,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalTRY: true },
      where: {
        status: { in: ["PAID", "IN_QUEUE", "PRINTING", "SHIPPED", "DELIVERED"] },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.design.count(),
    prisma.material.count({ where: { isActive: true } }),
    prisma.design.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.material.findMany({
      where: { stockGrams: { lt: 100 }, isActive: true },
      select: { id: true, name: true, stockGrams: true },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  const monthRevenue = Number(monthRevenueAgg._sum.totalTRY ?? 0);

  const statCards = [
    {
      label: "Toplam Siparişler",
      value: totalOrders,
      Icon: ShoppingBag,
    },
    {
      label: "Bu Ay Ciro",
      value: `₺${monthRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      Icon: TrendingUp,
    },
    {
      label: "Toplam Tasarım",
      value: totalDesigns,
      Icon: Layers,
    },
    {
      label: "Aktif Materyal",
      value: activeMaterials,
      Icon: Package,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                {s.label}
              </p>
              <s.Icon
                size={16}
                className="text-[var(--color-text-subtle)] shrink-0"
              />
            </div>
            <p className="mt-2 font-display text-3xl uppercase">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Alert Row */}
      {(pendingDesignsCount > 0 || lowStockMaterials.length > 0) && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {pendingDesignsCount > 0 && (
            <Link
              href="/admin/designs"
              className="flex-1 rounded-[var(--radius-card)] border border-amber-500/30 bg-amber-500/10 px-5 py-4 transition-colors hover:bg-amber-500/20"
            >
              <p className="text-sm font-medium text-amber-400">
                {pendingDesignsCount} tasarım onay bekliyor
              </p>
              <p className="mt-1 text-xs text-amber-400/70">
                Tasarımlar sayfasına git &rarr;
              </p>
            </Link>
          )}
          {lowStockMaterials.length > 0 && (
            <Link
              href="/admin/materials"
              className="flex-1 rounded-[var(--radius-card)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-5 py-4 transition-colors hover:bg-[var(--color-danger)]/20"
            >
              <p className="text-sm font-medium text-[var(--color-danger)]">
                Düşük stok uyarısı ({lowStockMaterials.length} materyal)
              </p>
              <p className="mt-1 text-xs text-[var(--color-danger)]/70">
                {lowStockMaterials.map((m) => m.name).join(", ")}
              </p>
            </Link>
          )}
        </div>
      )}

      {/* Recent Orders */}
      <section>
        <h2 className="font-display text-xl uppercase tracking-tight">
          Son Siparişler
        </h2>
        <div className="mt-4 overflow-hidden overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-2)] text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              <tr>
                <th className="px-4 py-3 text-left">Sipariş ID</th>
                <th className="px-4 py-3 text-left">Müşteri</th>
                <th className="px-4 py-3 text-left">Kalem</th>
                <th className="px-4 py-3 text-left">Toplam</th>
                <th className="px-4 py-3 text-left">Durum</th>
                <th className="px-4 py-3 text-left">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[var(--color-text-muted)]"
                  >
                    Henüz sipariş yok.
                  </td>
                </tr>
              )}
              {recentOrders.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-mono text-xs text-[var(--color-brand-2)] hover:underline"
                    >
                      #{o.id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--color-text)]">
                      {o.user.name ?? "—"}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {o.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {o._count.items}
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                    ₺{Number(o.totalTRY).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {o.createdAt.toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
