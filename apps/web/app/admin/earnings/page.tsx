import Link from "next/link";
import type { Prisma, DesignerEarningStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { MarkEarningPaidButton } from "@/components/admin/MarkEarningPaidButton";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const TRY = (n: number) =>
  n.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  });

export default async function AdminEarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const statusFilter: DesignerEarningStatus | null =
    sp.status === "PENDING_PAYOUT" || sp.status === "PAID_OUT" ? sp.status : null;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.DesignerEarningWhereInput = statusFilter
    ? { status: statusFilter }
    : {};

  const [rows, total, pendingTotal] = await Promise.all([
    prisma.designerEarning.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        designer: { select: { id: true, name: true, email: true } },
        design: { select: { id: true, slug: true, title: true } },
        order: { select: { id: true, status: true } },
        orderItem: { select: { quantity: true } },
      },
    }),
    prisma.designerEarning.count({ where }),
    prisma.designerEarning.aggregate({
      where: { status: "PENDING_PAYOUT" },
      _sum: { amountTRY: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pendingSum = pendingTotal._sum.amountTRY
    ? Number(pendingTotal._sum.amountTRY)
    : 0;

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/earnings?${qs}` : "/admin/earnings";
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-tight">
            Tasarımcı Kazançları
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Toplam {total} kayıt · Sayfa {page}/{totalPages} · Bekleyen ödeme:{" "}
            <span className="font-medium text-[var(--color-text)]">
              {TRY(pendingSum)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { v: null, label: "Tümü" },
            { v: "PENDING_PAYOUT", label: "Bekleyen" },
            { v: "PAID_OUT", label: "Ödendi" },
          ].map((t) => {
            const active = (statusFilter ?? "ALL") === (t.v ?? "ALL");
            return (
              <Link
                key={t.label}
                href={t.v ? `/admin/earnings?status=${t.v}` : "/admin/earnings"}
                className={
                  "rounded-full border px-3 py-1 text-xs transition-colors " +
                  (active
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-text)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">Kayıt yok.</p>
      ) : (
        <div className="overflow-hidden overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-2)] text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              <tr>
                <th className="px-4 py-3">Tasarımcı</th>
                <th className="px-4 py-3">Tasarım</th>
                <th className="px-4 py-3 text-right">Adet</th>
                <th className="px-4 py-3 text-right">Markup</th>
                <th className="px-4 py-3 text-right">Tutar</th>
                <th className="px-4 py-3">Sipariş</th>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <td className="px-4 py-3">
                    <p className="text-[var(--color-text)]">
                      {r.designer.name ?? "—"}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {r.designer.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/designs/${r.design.slug}`}
                      target="_blank"
                      className="hover:text-[var(--color-brand-2)]"
                    >
                      {r.design.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {r.orderItem.quantity}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    %{r.markupPercent}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-medium">
                    {TRY(Number(r.amountTRY))}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${r.order.id}`}
                      className="font-mono text-xs hover:text-[var(--color-brand-2)]"
                    >
                      #{r.order.id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                    {r.createdAt.toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "PAID_OUT" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-brand-2)]">
                        <CheckCircle2 className="size-3" />
                        Ödendi
                      </span>
                    ) : (
                      <MarkEarningPaidButton earningId={r.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2 text-sm">
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
