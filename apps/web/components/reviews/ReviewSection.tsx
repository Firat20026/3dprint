import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  getDesignRatingSummary,
  getUserReviewForDesign,
  listDesignReviews,
  userIsVerifiedBuyer,
} from "@/lib/reviews";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";
import { DeleteReviewButton } from "./DeleteReviewButton";
import { BadgeCheck } from "lucide-react";

export async function ReviewSection({
  designId,
  slug,
}: {
  designId: string;
  slug: string;
}) {
  const [summary, reviews, session] = await Promise.all([
    getDesignRatingSummary(designId),
    listDesignReviews(designId, 30),
    auth(),
  ]);

  const userId = session?.user?.id;

  const [verified, ownReview] = userId
    ? await Promise.all([
        userIsVerifiedBuyer(userId, designId),
        getUserReviewForDesign(userId, designId),
      ])
    : [false, null];

  return (
    <section className="mt-16 border-t border-border pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Yorumlar</p>
          <h2 className="mt-2 h-display text-2xl md:text-3xl">
            Kullanıcı Değerlendirmeleri
          </h2>
        </div>
        {summary.count > 0 && (
          <div className="text-right">
            <div className="flex items-center justify-end gap-3">
              <span className="font-display text-3xl">
                {summary.average.toFixed(1)}
              </span>
              <StarRating value={summary.average} size={18} hideCount />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.count} değerlendirme
            </p>
          </div>
        )}
      </div>

      {/* Distribution bars */}
      {summary.count > 0 && (
        <div className="mt-6 max-w-sm space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((n) => {
            const count = summary.distribution[n];
            const pct = summary.count > 0 ? (count / summary.count) * 100 : 0;
            return (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-muted-foreground">{n}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span
                    className="block h-full rounded-full bg-[var(--color-warning,#f5b740)]"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-8 text-right text-muted-foreground/70">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission form OR login prompt */}
      <div className="mt-8">
        {userId ? (
          <ReviewForm
            designId={designId}
            slug={slug}
            isVerifiedBuyer={verified}
            initial={
              ownReview
                ? {
                    rating: ownReview.rating,
                    title: ownReview.title,
                    body: ownReview.body,
                  }
                : undefined
            }
          />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Yorum yazmak için{" "}
            <Link
              href={`/login?next=/designs/${slug}`}
              className="font-medium text-foreground hover:underline"
            >
              giriş yap
            </Link>
            .
          </div>
        )}
      </div>

      {/* Review list */}
      <div className="mt-10 space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz yorum yok. İlk yorumu sen yaz.
          </p>
        ) : (
          reviews.map((r) => {
            const isOwn = r.userId === userId;
            const display = r.user.name?.trim() || "Anonim";
            return (
              <article
                key={r.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        {display}
                      </span>
                      {r.verifiedBuyer && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                          <BadgeCheck className="size-3" />
                          Doğrulanmış
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <StarRating value={r.rating} size={13} hideCount />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        {r.createdAt.toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  </div>
                  {isOwn && <DeleteReviewButton reviewId={r.id} slug={slug} />}
                </header>
                {r.title && (
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {r.title}
                  </p>
                )}
                {r.body && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {r.body}
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
