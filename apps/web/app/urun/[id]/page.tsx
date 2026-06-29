import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ExternalLink, ShieldCheck, Truck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { getProduct, formatMoney } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Ürün bulunamadı" };
  return {
    title: product.title,
    description: product.description ?? `${product.title} — frint3d`,
    openGraph: {
      title: `${product.title} — frint3d`,
      description: product.description ?? undefined,
      images: product.thumbnail ? [product.thumbnail] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const canBuy = product.inStock && !!product.url;

  return (
    <Container className="py-12 animate-fade-in">
      <Link
        href="/designs"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Kataloğa dön
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />

        <div>
          {product.categories[0] && (
            <p className="eyebrow">{product.categories[0]}</p>
          )}
          <h1 className="mt-3 h-display text-3xl md:text-4xl">{product.title}</h1>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl tracking-tight text-foreground">
              {formatMoney(product.effectivePrice, product.currency)}
            </span>
            {product.hasDiscount && (
              <span className="text-base text-muted-foreground line-through">
                {formatMoney(product.price, product.currency)}
              </span>
            )}
          </div>

          <div className="mt-3">
            {product.inStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Stokta
                {typeof product.stockQuantity === "number" &&
                  product.stockQuantity > 0 &&
                  ` · ${product.stockQuantity} adet`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                Tükendi
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="mt-8">
            {canBuy ? (
              <a
                href={product.url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-foreground/90 sm:w-auto"
              >
                Shopier&apos;de Satın Al
                <ExternalLink className="size-4" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-medium text-muted-foreground sm:w-auto"
              >
                {product.inStock ? "Yakında" : "Şu an tükendi"}
              </button>
            )}
            <p className="mt-3 text-xs text-muted-foreground/80">
              Ödeme ve teslimat Shopier üzerinden güvenle tamamlanır.
            </p>
          </div>

          <dl className="mt-8 grid grid-cols-1 gap-3 border-t border-border pt-6 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <dt className="text-xs font-medium text-foreground">
                  Shopier güvencesi
                </dt>
                <dd className="text-xs text-muted-foreground">
                  Güvenli kart ödemesi, alıcı koruması.
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Truck className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <dt className="text-xs font-medium text-foreground">Kargo</dt>
                <dd className="text-xs text-muted-foreground">
                  {product.shippingPrice && product.shippingPrice > 0
                    ? `Kargo: ${formatMoney(product.shippingPrice, product.currency)}`
                    : "Kargo Shopier sayfasında belirtilir."}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </div>
    </Container>
  );
}
