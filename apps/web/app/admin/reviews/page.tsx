import Link from "next/link";
import type { Prisma, ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { StarRating } from "@/components/reviews/StarRating";
import { ReviewModerationButtons } from "@/components/admin/ReviewModerationButtons";
import { BadgeCheck } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SearchParams = Promise<{ status?: string; page?: string }>;

const STATUS_TABS = [
  { value: "ALL", label: "Tümü" },
  { value: "APPROVED", label: "Yayında" },
  { value: "HIDDEN", label: "Gizlenmiş" },
] as const;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const statusFilter: ReviewStatus | null =
    sp.status === "APPROVED" || sp.status === "HIDDEN" ? sp.status : null;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.DesignReviewWhereInput = statusFilter
    ? { status: statusFilter }
    : {};

  const [reviews, total] = await Promise.all([
    prisma.designReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, email: true } },
        design: { select: { id: true, slug: true, title: true } },
      },
    }),
    prisma.designReview.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/reviews?${qs}` : "/admin/reviews";
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-tight">
            Tasarım Yorumları
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Toplam {total} yorum · Sayfa {page}/{totalPages}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => {
            const active = (statusFilter ?? "ALL") === t.value;
            return (
              <Link
                key={t.value}
                href={
                  t.value === "ALL"
                    ? "/admin/reviews"
                    : `/admin/reviews?status=${t.value}`
                }
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

      {reviews.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">Yorum yok.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <Link
                      href={`/designs/${r.design.slug}`}
                      className="font-medium text-[var(--color-text)] hover:text-[var(--color-brand-2)]"
                      target="_blank"
                    >
                      {r.design.title}
                    </Link>
                    {r.status === "HIDDEN" && (
                      <span className="rounded-full bg-[var(--color-danger)]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-danger)]">
                        Gizli
                      </span>
                    )}
                    {r.verifiedBuyer && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-brand-2)]">
                        <BadgeCheck className="size-3" />
                        Doğrulanmış
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {r.user.name ?? "—"} · {r.user.email} ·{" "}
                    {r.createdAt.toLocaleString("tr-TR")}
                  </p>
                  <div className="mt-2">
                    <StarRating value={r.rating} size={13} hideCount />
                  </div>
                </div>
                <ReviewModerationButtons
                  reviewId={r.id}
                  status={r.status}
                />
              </header>
              {r.title && (
                <p className="mt-3 text-sm font-medium text-[var(--color-text)]">
                  {r.title}
                </p>
              )}
              {r.body && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {r.body}
                </p>
              )}
              {r.hiddenReason && (
                <p className="mt-3 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-3 py-2 text-xs text-[var(--color-danger)]">
                  Gizleme sebebi: {r.hiddenReason}
                </p>
              )}
            </article>
          ))}
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
