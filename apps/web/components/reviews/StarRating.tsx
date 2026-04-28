import { Star } from "lucide-react";

type Props = {
  /** Continuous rating 0..5; partial stars rendered via overlay clip. */
  value: number;
  /** Lucide stroke width passes through to the icons. */
  size?: number;
  /** Optional review count rendered as "(N)" next to the stars. */
  count?: number;
  className?: string;
  /** Hide the count even if provided (useful when caller renders it elsewhere). */
  hideCount?: boolean;
};

export function StarRating({
  value,
  size = 14,
  count,
  className = "",
  hideCount = false,
}: Props) {
  const clamped = Math.max(0, Math.min(5, value));
  const filledPercent = (clamped / 5) * 100;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[var(--color-text-muted)] ${className}`}
      role="img"
      aria-label={`${clamped.toFixed(1)} / 5 yıldız${count ? `, ${count} değerlendirme` : ""}`}
    >
      <span className="relative inline-flex">
        {/* Empty layer (background) */}
        <span className="flex">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              size={size}
              className="text-[var(--color-border)]"
              strokeWidth={1.5}
              fill="none"
            />
          ))}
        </span>
        {/* Filled layer clipped by percentage */}
        <span
          className="absolute inset-0 flex overflow-hidden"
          style={{ width: `${filledPercent}%` }}
          aria-hidden
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              size={size}
              className="text-[var(--color-warning,#f5b740)]"
              strokeWidth={1.5}
              fill="currentColor"
            />
          ))}
        </span>
      </span>
      {!hideCount && typeof count === "number" && (
        <span className="text-xs">
          {count > 0 ? clamped.toFixed(1) : "—"}
          {count > 0 && (
            <span className="ml-1 text-[var(--color-text-subtle)]">({count})</span>
          )}
        </span>
      )}
    </span>
  );
}
