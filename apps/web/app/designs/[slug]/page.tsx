import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ModelViewer } from "@/components/viewer/ModelViewer";
import { AddToCartForm } from "@/components/shop/AddToCartForm";
import {
  getDesignBySlug,
  listActiveProfiles,
  listMaterialsInStock,
} from "@/lib/designs";
import { publicUrlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function DesignDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const design = await getDesignBySlug(slug);
  if (!design || design.status !== "PUBLISHED") notFound();

  const [materials, profiles] = await Promise.all([
    listMaterialsInStock(),
    listActiveProfiles(),
  ]);

  const modelUrl = publicUrlFor(design.modelFileKey);

  return (
    <Container className="py-12">
      <nav className="mb-6 text-xs text-[var(--color-text-muted)]">
        <Link href="/" className="hover:text-[var(--color-text)]">
          Ana Sayfa
        </Link>
        <span className="mx-2">/</span>
        <Link href="/designs" className="hover:text-[var(--color-text)]">
          Tasarımlar
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--color-text)]">{design.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          {modelUrl && (design.fileFormat === "stl" || design.fileFormat === "3mf") ? (
            <ModelViewer url={modelUrl} format={design.fileFormat} />
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)]">
              Model bulunamadı
            </div>
          )}
          {design.description && (
            <p className="mt-5 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {design.description}
            </p>
          )}
        </div>

        <div>
          {design.category && (
            <p className="text-xs uppercase tracking-wider text-[var(--color-accent)]">
              {design.category}
            </p>
          )}
          <h1 className="mt-3 h-display text-4xl md:text-5xl">
            {design.title}
          </h1>

          {materials.length === 0 ? (
            <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-5 text-sm text-[var(--color-danger)]">
              Şu an stokta aktif materyal bulunmuyor. Admin&apos;in stok
              eklemesi bekleniyor.
            </div>
          ) : (
            <div className="mt-6">
              <AddToCartForm
                designId={design.id}
                designSlug={design.slug}
                title={design.title}
                thumbnailUrl={design.thumbnailUrl}
                defaultProfileId={design.defaultProfileId}
                materials={materials.map((m) => ({
                  id: m.id,
                  name: m.name,
                  type: m.type,
                  colorHex: m.colorHex,
                  pricePerGramTRY: m.pricePerGramTRY,
                }))}
                profiles={profiles.map((p) => ({
                  id: p.id,
                  name: p.name,
                  layerHeightMm: p.layerHeightMm,
                  infillPercent: p.infillPercent,
                }))}
              />
            </div>
          )}

          <div className="mt-8 grid grid-cols-2 gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs">
            <div>
              <p className="uppercase tracking-wider text-[var(--color-text-muted)]">
                Format
              </p>
              <p className="mt-1 text-[var(--color-text)]">
                {design.fileFormat.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="uppercase tracking-wider text-[var(--color-text-muted)]">
                Printer
              </p>
              <p className="mt-1 text-[var(--color-text)]">Snapmaker U1</p>
            </div>
            <div>
              <p className="uppercase tracking-wider text-[var(--color-text-muted)]">
                Kargo
              </p>
              <p className="mt-1 text-[var(--color-text)]">
                2-4 iş günü · Türkiye
              </p>
            </div>
            <div>
              <p className="uppercase tracking-wider text-[var(--color-text-muted)]">
                Kaynak
              </p>
              <p className="mt-1 text-[var(--color-text)]">
                {design.source === "ADMIN" ? "frint3d resmi" : "Topluluk"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
