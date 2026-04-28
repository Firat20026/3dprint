import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ModelViewer } from "@/components/viewer/ModelViewer";
import { AddToCartForm } from "@/components/shop/AddToCartForm";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { StarRating } from "@/components/reviews/StarRating";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { auth } from "@/lib/auth";
import { getWishlistedDesignIds } from "@/lib/wishlist";
import {
  getDesignBySlug,
  listActiveProfiles,
  listMaterialsInStock,
} from "@/lib/designs";
import { getDesignRatingSummary } from "@/lib/reviews";
import { publicUrlFor } from "@/lib/urls";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

type MaterialGroup = {
  extruderId: number;
  name: string | null;
  colorHex: string | null;
};

const SITE_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const design = await getDesignBySlug(slug).catch(() => null);
  if (!design || design.status !== "PUBLISHED") {
    return { title: "Tasarım bulunamadı — frint3d" };
  }

  const ogImage = design.thumbnailUrl
    ? (SITE_URL
        ? `${SITE_URL}${publicUrlFor(design.thumbnailUrl)}`
        : (publicUrlFor(design.thumbnailUrl) ?? undefined))
    : undefined;

  const description =
    design.description?.slice(0, 200) ??
    `${design.title} — Snapmaker U1 ile profesyonel 3D baskı, kapına kadar.`;

  return {
    title: `${design.title} — frint3d`,
    description,
    openGraph: {
      title: design.title,
      description,
      type: "website",
      url: SITE_URL ? `${SITE_URL}/designs/${design.slug}` : undefined,
      images: ogImage ? [{ url: ogImage, width: 1024, height: 1024 }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: design.title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function DesignDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const design = await getDesignBySlug(slug);
  if (!design || design.status !== "PUBLISHED") notFound();

  const session = await auth();
  const [materials, profiles, settings, ratingSummary, wishlistedIds] =
    await Promise.all([
      listMaterialsInStock(),
      listActiveProfiles(),
      getSettings(),
      getDesignRatingSummary(design.id),
      getWishlistedDesignIds(session?.user?.id),
    ]);
  const isWishlisted = wishlistedIds.has(design.id);

  const modelUrl = publicUrlFor(design.modelFileKey);
  const materialGroups = (design.materialGroups ?? []) as MaterialGroup[];
  const plateCount = design.plateCount ?? 1;

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

          {/* Material legend (3MF only, when multiple extruders detected) */}
          {materialGroups.length > 1 && (
            <div className="mt-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Tasarım Materyalleri ({materialGroups.length})
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {materialGroups.map((g) => (
                  <li
                    key={`${g.extruderId}-${g.name ?? ""}-${g.colorHex ?? ""}`}
                    className="flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-1.5 text-xs"
                  >
                    <span
                      className="size-3.5 shrink-0 rounded-full border border-white/15"
                      style={{ backgroundColor: g.colorHex ?? "#888" }}
                    />
                    <span className="truncate">{g.name ?? `Ekstruder ${g.extruderId}`}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] text-[var(--color-text-subtle)]">
                Tasarımcının tercih ettiği renk şeması — sepette istediğin
                materyali seçebilirsin.
              </p>
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

          {ratingSummary.count > 0 && (
            <div className="mt-3">
              <StarRating
                value={ratingSummary.average}
                count={ratingSummary.count}
                size={16}
              />
            </div>
          )}

          <div className="mt-4">
            <WishlistButton
              designId={design.id}
              initial={isWishlisted}
              variant="full"
            />
          </div>

          {/* Plate / multi-mat badges right under the title */}
          {(plateCount > 1 || materialGroups.length > 1) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {plateCount > 1 && (
                <span className="rounded-full border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--color-brand-2)]">
                  {plateCount} plate
                </span>
              )}
              {materialGroups.length > 1 && (
                <span className="rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--color-accent)]">
                  {materialGroups.length} renk / materyal
                </span>
              )}
            </div>
          )}

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
                plateCount={plateCount}
                designerMarkupPercent={design.basePriceMarkupPercent ?? 0}
                marginPercent={settings.marginPercent}
                setupFeeTRY={settings.setupFeeTRY}
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

      <ReviewSection designId={design.id} slug={design.slug} />
    </Container>
  );
}

