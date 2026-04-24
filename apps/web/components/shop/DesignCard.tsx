import Link from "next/link";
import { publicUrlFor } from "@/lib/urls";
import type { Design } from "@prisma/client";

export function DesignCard({ design }: { design: Design }) {
  const thumbUrl = publicUrlFor(design.thumbnailUrl);
  return (
    <Link
      href={`/designs/${design.slug}`}
      className="group hover-lift block overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand)]/40 hover:shadow-[var(--shadow-card)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface-2)]">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={design.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
            Önizleme yok
          </div>
        )}
        {design.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-1 text-[10px] uppercase tracking-wider text-white backdrop-blur">
            {design.category}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-[var(--color-text)]">
          {design.title}
        </h3>
        {design.description && (
          <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">
            {design.description}
          </p>
        )}
        <p className="mt-3 inline-flex items-center gap-1 text-xs uppercase tracking-wider text-[var(--color-brand-2)]">
          Detayı Gör
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </p>
      </div>
    </Link>
  );
}
