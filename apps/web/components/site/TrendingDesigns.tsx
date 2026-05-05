import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/site/HowItWorks";
import { Reveal } from "@/components/site/Reveal";
import { DesignCard } from "@/components/shop/DesignCard";
import { listTrendingDesigns } from "@/lib/trending";
import { getDesignRatingSummaries } from "@/lib/reviews";
import { getWishlistedDesignIds } from "@/lib/wishlist";
import { auth } from "@/lib/auth";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export async function TrendingDesigns() {
  const designs = await listTrendingDesigns(8).catch(() => []);
  if (designs.length === 0) return null;

  const session = await auth().catch(() => null);
  const [ratings, wishlistedIds] = await Promise.all([
    getDesignRatingSummaries(designs.map((d) => d.id)).catch(() => new Map()),
    getWishlistedDesignIds(session?.user?.id).catch(() => new Set<string>()),
  ]);

  return (
    <section className="relative py-20 md:py-28">
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <SectionHeader
            align="left"
            eyebrow="Öne Çıkanlar"
            title="Son 30 günün en çok basılanları"
            subtitle="Topluluğun ve resmi katalogun en sevilen tasarımları."
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
          {designs.map((d) => (
            <DesignCard
              key={d.id}
              design={d}
              rating={ratings.get(d.id)}
              wishlisted={wishlistedIds.has(d.id)}
            />
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
