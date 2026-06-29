import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/site/HowItWorks";
import { StoreEmbed } from "@/components/site/StoreEmbed";

const STORE_URL =
  process.env.SHOPIER_STORE_URL || "https://www.shopier.com/frint";

/**
 * Homepage product section — embeds the Shopier store so visitors can browse
 * and buy without leaving the site. Full catalog lives at /designs.
 */
export function FeaturedProducts() {
  return (
    <section className="relative py-20 md:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <SectionHeader
            align="left"
            eyebrow="Ürünler"
            title="Hazır tasarımlar"
            subtitle="Mağazamızdan beğen, Shopier güvencesiyle hemen sipariş ver."
          />
          <Link
            href="/designs"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Tam ekran katalog
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </Container>

      <div className="mt-10 overflow-hidden border-y border-border">
        <StoreEmbed
          src={STORE_URL}
          title="frint3d mağaza"
          className="h-[78vh] min-h-[560px]"
        />
      </div>
    </section>
  );
}
