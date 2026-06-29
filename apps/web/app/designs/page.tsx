import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ShopierProductCard } from "@/components/shop/ShopierProductCard";
import { listProducts } from "@/lib/catalog";
import type { Product } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tasarım Kataloğu",
  description:
    "Hazır 3D baskı ürünleri — dekorasyon, organizasyon, hediyelik ve daha fazlası. Seç, Shopier güvencesiyle sipariş ver.",
  openGraph: {
    title: "Tasarım Kataloğu — frint3d",
    description: "Hazır 3D baskı ürünleri. Shopier güvencesiyle sipariş ver.",
  },
};

const VALID_SORTS = new Set(["newest", "price-asc", "price-desc", "alpha"] as const);
type Sort = "newest" | "price-asc" | "price-desc" | "alpha";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  stock?: string; // "in" → only in-stock
  sort?: string;
}>;

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

export default async function DesignsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const category = sp.category && sp.category !== "all" ? sp.category : null;
  const inStockOnly = sp.stock === "in";
  const sort = (VALID_SORTS.has(sp.sort as never) ? sp.sort : "newest") as Sort;

  const products = await listProducts();

  // Distinct categories for the filter chips, derived from the catalog itself.
  const categories = [
    ...new Set(products.flatMap((p) => p.categories)),
  ].sort((a, b) => a.localeCompare(b, "tr"));

  // In-memory filtering — the store is small enough that fetching once and
  // filtering here is simpler than round-tripping every filter to Shopier.
  let filtered = products;
  if (q) {
    const nq = normalizeText(q);
    filtered = filtered.filter((p) => {
      const hay = normalizeText(
        `${p.title} ${p.description ?? ""} ${p.categories.join(" ")}`,
      );
      return hay.includes(nq);
    });
  }
  if (category) {
    filtered = filtered.filter((p) => p.categories.includes(category));
  }
  if (inStockOnly) {
    filtered = filtered.filter((p) => p.inStock);
  }
  filtered = sortProducts(filtered, sort);

  const hasActiveFilter = q.length > 0 || !!category || inStockOnly;

  function urlWith(overrides: Partial<Record<string, string | null>>): string {
    const params = new URLSearchParams();
    const merged: Record<string, string | null | undefined> = {
      q,
      category,
      stock: inStockOnly ? "in" : null,
      sort: sort === "newest" ? null : sort,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `/designs?${qs}` : "/designs";
  }

  return (
    <Container className="py-12 animate-fade-in">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Katalog</p>
          <h1 className="mt-3 h-display text-4xl md:text-5xl">Hazır Tasarımlar</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Beğendiğin ürünü seç, Shopier güvencesiyle sipariş ver. Yeni
            tasarımlar düzenli olarak eklenir.
          </p>
        </div>
        <p className="text-xs text-muted-foreground/70">{filtered.length} ürün</p>
      </div>

      {/* Search + filter bar */}
      <form
        method="get"
        action="/designs"
        className="mt-8 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-end"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Ara — başlık, açıklama, kategori"
            className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          />
          <select
            name="sort"
            defaultValue={sort}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <option value="newest">Yeniden eskiye</option>
            <option value="price-asc">Fiyat: artan</option>
            <option value="price-desc">Fiyat: azalan</option>
            <option value="alpha">A → Z</option>
          </select>
        </div>
        <button
          type="submit"
          className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Ara
        </button>

        {/* Hidden inputs preserve other filters when submitting via the search
            box (server reads them from the query string). */}
        {category && <input type="hidden" name="category" value={category} />}
        {inStockOnly && <input type="hidden" name="stock" value="in" />}

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:col-span-2">
            <FilterChip
              label="Tüm kategoriler"
              active={!category}
              href={urlWith({ category: null })}
            />
            {categories.map((c) => (
              <FilterChip
                key={c}
                label={c}
                active={category === c}
                href={urlWith({ category: c })}
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3 sm:col-span-2">
          <FilterChip
            label="Sadece stoktakiler"
            active={inStockOnly}
            href={urlWith({ stock: inStockOnly ? null : "in" })}
          />
          {hasActiveFilter && (
            <Link
              href="/designs"
              className="ml-1 text-xs text-muted-foreground hover:text-destructive"
            >
              Temizle
            </Link>
          )}
        </div>
      </form>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-display text-xl uppercase tracking-tight text-foreground">
            {hasActiveFilter
              ? "Aramaya uyan ürün bulunamadı"
              : "Henüz ürün yok"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {hasActiveFilter
              ? "Filtreleri gevşetmeyi dene veya farklı bir arama yap."
              : "Admin panelden ürün eklendiğinde burada görünecek."}
          </p>
        </div>
      ) : (
        <div
          className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          data-stagger
        >
          {filtered.map((p) => (
            <ShopierProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </Container>
  );
}

function sortProducts(list: Product[], sort: Sort): Product[] {
  const arr = [...list];
  switch (sort) {
    case "price-asc":
      return arr.sort((a, b) => a.effectivePrice - b.effectivePrice);
    case "price-desc":
      return arr.sort((a, b) => b.effectivePrice - a.effectivePrice);
    case "alpha":
      return arr.sort((a, b) => a.title.localeCompare(b.title, "tr"));
    case "newest":
    default:
      return arr; // already dateDesc from the API
  }
}

function FilterChip({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-full border px-3 py-1.5 text-xs transition-colors " +
        (active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground")
      }
    >
      {label}
    </Link>
  );
}
