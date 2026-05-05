"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, BadgeCheck } from "lucide-react";
import { submitDesignReview } from "@/app/designs/[slug]/actions";

type Props = {
  designId: string;
  slug: string;
  isVerifiedBuyer: boolean;
  initial?: {
    rating: number;
    title: string | null;
    body: string | null;
  };
};

export function ReviewForm({ designId, slug, isVerifiedBuyer, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState<number>(initial?.rating ?? 0);
  const [hover, setHover] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    if (rating < 1 || rating > 5) {
      setError("Lütfen 1-5 arası bir puan seç.");
      return;
    }
    formData.set("rating", String(rating));
    formData.set("designId", designId);
    formData.set("slug", slug);

    startTransition(async () => {
      const res = await submitDesignReview(formData);
      if (res.ok) {
        setSuccess(initial ? "Yorumun güncellendi." : "Yorumun yayında. Teşekkürler!");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  const display = hover || rating;

  return (
    <form
      action={onSubmit}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-base uppercase tracking-tight">
          {initial ? "Yorumunu Güncelle" : "Bu Tasarıma Puan Ver"}
        </h3>
        {isVerifiedBuyer && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-primary">
            <BadgeCheck className="size-3" />
            Doğrulanmış Alıcı
          </span>
        )}
      </div>

      <div
        className="mt-4 flex items-center gap-1"
        onMouseLeave={() => setHover(0)}
        role="radiogroup"
        aria-label="Puan"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} yıldız`}
            className="rounded p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Star
              size={26}
              strokeWidth={1.5}
              className={
                n <= display
                  ? "text-[var(--color-warning,#f5b740)]"
                  : "text-[var(--color-border)]"
              }
              fill={n <= display ? "currentColor" : "none"}
            />
          </button>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          {display > 0 ? `${display}/5` : "Yıldız seç"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <input
          type="text"
          name="title"
          defaultValue={initial?.title ?? ""}
          placeholder="Kısa başlık (ops.)"
          maxLength={80}
          className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:border-primary focus:outline-none"
        />
        <textarea
          name="body"
          defaultValue={initial?.body ?? ""}
          placeholder="Bu tasarımı kullanırken neler yaşadın? Baskı kalitesi, montaj, kullanım… (ops.)"
          maxLength={2000}
          rows={4}
          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {error && (
        <p className="mt-3 text-xs text-destructive">{error}</p>
      )}
      {success && (
        <p className="mt-3 text-xs text-primary">{success}</p>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={pending || rating < 1}
          className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Kaydediliyor…" : initial ? "Güncelle" : "Yorumu Gönder"}
        </button>
      </div>
    </form>
  );
}
