import Link from "next/link";
import { publicUrlFor } from "@/lib/urls";
import type { Design } from "@prisma/client";
import { StarRating } from "@/components/reviews/StarRating";
import { WishlistButton } from "./WishlistButton";

type MaterialGroup = { extruderId: number; name: string | null; colorHex: string | null };

type RatingSummary = { average: number; count: number };

export function DesignCard({
  design,
  rating,
  wishlisted,
  showWishlist = true,
}: {
  design: Design;
  rating?: RatingSummary;
  wishlisted?: boolean;
  showWishlist?: boolean;
}) {
  const thumbUrl = publicUrlFor(design.thumbnailUrl);
  const materialGroups = (design.materialGroups ?? []) as MaterialGroup[];
  const plateCount = design.plateCount ?? 1;

  return (
    <Link
      href={`/designs/${design.slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={design.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wider text-muted-foreground/70">
            Önizleme yok
          </div>
        )}
        {design.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-1 text-[10px] uppercase tracking-wider text-white backdrop-blur">
            {design.category}
          </span>
        )}

        {showWishlist && (
          <div className="absolute right-3 top-3">
            <WishlistButton designId={design.id} initial={!!wishlisted} />
          </div>
        )}

        {/* Multi-plate / multi-material badges — bottom-right corner so they
            don't fight the category chip on the top-left. */}
        {(plateCount > 1 || materialGroups.length > 1) && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {plateCount > 1 && (
              <span className="rounded-full bg-foreground/85 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-background backdrop-blur">
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
        <h3 className="text-sm font-medium text-foreground">
          {design.title}
        </h3>
        {design.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {design.description}
          </p>
        )}
        {rating && rating.count > 0 && (
          <div className="mt-2">
            <StarRating value={rating.average} count={rating.count} size={12} />
          </div>
        )}
        <p className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
          Detayı Gör
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">
            →
          </span>
        </p>
      </div>
    </Link>
  );
}
