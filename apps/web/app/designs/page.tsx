import Link from "next/link";
import { Container } from "@/components/ui/container";
import { DesignCard } from "@/components/shop/DesignCard";
import {
  searchPublishedDesigns,
  listPublishedDesignCategories,
} from "@/lib/designs";
import { getDesignRatingSummaries } from "@/lib/reviews";
import type { DesignSource } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_SOURCES: DesignSource[] = ["ADMIN", "USER_MARKETPLACE", "MESHY"];
const VALID_SORTS = new Set(["newest", "oldest", "alpha"] as const);

type SearchParams = Promise<{
  q?: string;
  category?: string;
  source?: string;
  plates?: string; // "multi" → only multi-plate
  materials?: string; // "multi" → only multi-material
  sort?: string;
}>;

export default async function DesignsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const category = sp.category && sp.category !== "all" ? sp.category : null;
  const source =
    sp.source && VALID_SOURCES.includes(sp.source as DesignSource)
      ? (sp.source as DesignSource)
      : null;
  const multiPlate = sp.plates === "multi";
  const multiMaterial = sp.materials === "multi";
  const sort = (VALID_SORTS.has(sp.sort as never) ? sp.sort : "newest") as
    | "newest"
    | "oldest"
    | "alpha";

  const [designs, categories] = await Promise.all([
    searchPublishedDesigns({
      q,
      category,
      source,
      multiPlate,
      multiMaterial,
      sort,
    }),
    listPublishedDesignCategories(),
  ]);

  const ratings = await getDesignRatingSummaries(designs.map((d) => d.id));

  const hasActiveFilter =
    q.length > 0 || category || source || multiPlate || multiMaterial;

  // Helper builds a URL with one filter changed and others preserved.
  function urlWith(
    overrides: Partial<Record<string, string | null>>,
  ): string {
    const params = new URLSearchParams();
    const merged: Record<string, string | null | undefined> = {
      q,
      category,
      source,
      plates: multiPlate ? "multi" : null,
      materials: multiMaterial ? "multi" : null,
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
          <h1 className="mt-3 h-display text-4xl md:text-5xl">
            Hazır Tasarımlar
          </h1>
          <p className="mt-3 max-w-xl text-sm text-[var(--color-text-muted)]">
            Seç, materyal ve kaliteni belirle, Snapmaker U1&apos;de basıp
            kapına gönderelim. Yeni tasarımlar düzenli olarak eklenir.
          </p>
        </div>
        <p className="text-xs text-[var(--color-text-subtle)]">
          {designs.length} tasarım
        </p>
      </div>

      {/* Search + filter bar */}
      <form
        method="get"
        action="/designs"
        className="mt-8 grid gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-[1fr_auto] sm:items-end"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Ara — başlık, açıklama, kategori"
            className="h-10 flex-1 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-text)] focus:border-[var(--color-brand)] focus:outline-none"
          />
          <select
            name="sort"
            defaultValue={sort}
            className="h-10 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-sm text-[var(--color-text)]"
          >
            <option value="newest">Yeniden eskiye</option>
            <option value="oldest">Eskiden yeniye</option>
            <option value="alpha">A → Z</option>
          </select>
        </div>
        <button
          type="submit"
          className="h-10 rounded-[var(--radius-button)] bg-[var(--color-brand)] px-4 text-sm font-medium text-white hover:bg-[var(--color-brand-2)]"
        >
          Ara
        </button>

        {/* Hidden inputs preserve other filters when submitting via the
            search box (server reads them from query string). */}
        {category && <input type="hidden" name="category" value={category} />}
        {source && <input type="hidden" name="source" value={source} />}
        {multiPlate && <input type="hidden" name="plates" value="multi" />}
        {multiMaterial && (
          <input type="hidden" name="materials" value="multi" />
        )}

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

        <div className="flex flex-wrap gap-1.5 border-t border-[var(--color-border)] pt-3 text-xs sm:col-span-2">
          <span className="self-center text-[10px] uppercase tracking-wider text-[var(--color-text-subtle)]">
            Hızlı filtre:
          </span>
          <FilterChip
            label="Çoklu plate"
            active={multiPlate}
            href={urlWith({ plates: multiPlate ? null : "multi" })}
          />
          <FilterChip
            label="Çok renkli"
            active={multiMaterial}
            href={urlWith({ materials: multiMaterial ? null : "multi" })}
          />
          <FilterChip
            label="Resmi (frint3d)"
            active={source === "ADMIN"}
            href={urlWith({ source: source === "ADMIN" ? null : "ADMIN" })}
          />
          <FilterChip
            label="Topluluk"
            active={source === "USER_MARKETPLACE"}
            href={urlWith({
              source: source === "USER_MARKETPLACE" ? null : "USER_MARKETPLACE",
            })}
          />
          <FilterChip
            label="AI üretim"
            active={source === "MESHY"}
            href={urlWith({ source: source === "MESHY" ? null : "MESHY" })}
          />
          {hasActiveFilter && (
            <Link
              href="/designs"
              className="ml-auto text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
            >
              Filtreleri temizle
            </Link>
          )}
        </div>
      </form>

      {designs.length === 0 ? (
        <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="font-display text-xl uppercase tracking-tight text-[var(--color-text)]">
            {hasActiveFilter
              ? "Aramaya uyan tasarım bulunamadı"
              : "Henüz tasarım yayında değil"}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {hasActiveFilter
              ? "Filtreleri gevşetmeyi dene veya farklı bir arama yap."
              : "Admin panelinden ilk tasarımını yüklediğin anda burada görünecek."}
          </p>
        </div>
      ) : (
        <div
          className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          data-stagger
        >
          {designs.map((d) => (
            <DesignCard key={d.id} design={d} rating={ratings.get(d.id)} />
          ))}
        </div>
      )}
    </Container>
  );
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
          ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand-2)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-brand)]/40 hover:text-[var(--color-text)]")
      }
    >
      {label}
    </Link>
  );
}
