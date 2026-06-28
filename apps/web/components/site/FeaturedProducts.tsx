import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/site/HowItWorks";
import { Reveal } from "@/components/site/Reveal";
import { ShopierProductCard } from "@/components/shop/ShopierProductCard";
import { listFeaturedProducts } from "@/lib/shopier";

export const dynamic = "force-dynamic";

/**
 * Homepage "Öne Çıkanlar" — products from the configured Shopier selection
 * (seçki). Renders nothing when there are no live products (and fixtures are
 * off), so the homepage degrades cleanly before the store is populated.
 */
export async function FeaturedProducts() {
  const { products } = await listFeaturedProducts(8).catch(() => ({
    products: [],
    isFixture: false,
  }));
  if (products.length === 0) return null;

  return (
    <section className="relative py-20 md:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <SectionHeader
            align="left"
            eyebrow="Öne Çıkanlar"
            title="Seçtiğimiz tasarımlar"
            subtitle="Mağazamızdan öne çıkan, en sevilen baskılar."
          />
          <Link
            href="/designs"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Tüm katalog
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <Reveal className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger>
          {products.map((p) => (
            <ShopierProductCard key={p.id} product={p} />
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
