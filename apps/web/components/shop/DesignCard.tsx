import Link from "next/link";
import { publicUrlFor } from "@/lib/urls";
import type { Design } from "@prisma/client";

type MaterialGroup = { extruderId: number; name: string | null; colorHex: string | null };

export function DesignCard({ design }: { design: Design }) {
  const thumbUrl = publicUrlFor(design.thumbnailUrl);
  const materialGroups = (design.materialGroups ?? []) as MaterialGroup[];
  const plateCount = design.plateCount ?? 1;

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

        {/* Multi-plate / multi-material badges — bottom-right corner so they
            don't fight the category chip on the top-left. */}
        {(plateCount > 1 || materialGroups.length > 1) && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {plateCount > 1 && (
              <span className="rounded-full bg-[var(--color-brand)]/85 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
                {plateCount} plate
              </span>
            )}
            {materialGroups.length > 1 && (
              <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                {materialGroups.slice(0, 4).map((g, i) => (
                  <span
                    key={i}
                    className="size-2 rounded-full border border-white/30"
                    style={{ backgroundColor: g.colorHex ?? "#888" }}
                  />
                ))}
                {materialGroups.length > 4 && <span>+{materialGroups.length - 4}</span>}
              </span>
            )}
          </div>
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
