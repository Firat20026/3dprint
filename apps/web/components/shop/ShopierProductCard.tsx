import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { formatMoney } from "@/lib/catalog";

/**
 * Catalog card for a product. Links to the on-site detail page (/urun/[id]);
 * the actual purchase happens on Shopier (see the detail page's "Shopier'de
 * Satın Al" button).
 */
export function ShopierProductCard({ product }: { product: Product }) {
  const { thumbnail, title, categories, hasDiscount, price, effectivePrice, currency, inStock } =
    product;

  return (
    <Link
      href={`/urun/${product.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wider text-muted-foreground/70">
            Görsel yok
          </div>
        )}

        {categories[0] && (
          <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2 py-1 text-[10px] uppercase tracking-wider text-white backdrop-blur">
            {categories[0]}
          </span>
        )}

        {hasDiscount && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-primary-foreground">
            İndirim
          </span>
        )}

        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-foreground/85 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-background">
              Tükendi
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 text-sm font-medium text-foreground">{title}</h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-lg tracking-tight text-foreground">
            {formatMoney(effectivePrice, currency)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatMoney(price, currency)}
            </span>
          )}
        </div>

        <p className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
          İncele
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">
            →
          </span>
        </p>
      </div>
    </Link>
  );
}
