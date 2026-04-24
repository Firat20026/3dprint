import { Container } from "@/components/ui/container";
import { DesignCard } from "@/components/shop/DesignCard";
import { listPublishedDesigns } from "@/lib/designs";

export const dynamic = "force-dynamic";

export default async function DesignsPage() {
  const designs = await listPublishedDesigns();
  const categories = Array.from(
    new Set(designs.map((d) => d.category).filter(Boolean) as string[]),
  );

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

      {categories.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text-muted)]"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {designs.length === 0 ? (
        <div className="mt-16 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="font-display text-xl uppercase tracking-tight text-[var(--color-text)]">
            Henüz tasarım yayında değil
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Admin panelinden ilk tasarımını yüklediğin anda burada
            görünecek.
          </p>
        </div>
      ) : (
        <div
          className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          data-stagger
        >
          {designs.map((d) => (
            <DesignCard key={d.id} design={d} />
          ))}
        </div>
      )}
    </Container>
  );
}
