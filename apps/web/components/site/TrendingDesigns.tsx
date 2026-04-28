import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/site/HowItWorks";
import { Reveal } from "@/components/site/Reveal";
import { DesignCard } from "@/components/shop/DesignCard";
import { listTrendingDesigns } from "@/lib/trending";
import { getDesignRatingSummaries } from "@/lib/reviews";
import { getWishlistedDesignIds } from "@/lib/wishlist";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Server component for the home page. Falls back to a newest-first list
 * when there are no recent sales — keeps the section non-empty in dev /
 * during the quiet period right after launch.
 */
export async function TrendingDesigns() {
  const designs = await listTrendingDesigns(8).catch(() => []);
  if (designs.length === 0) return null;

  const session = await auth();
  const [ratings, wishlistedIds] = await Promise.all([
    getDesignRatingSummaries(designs.map((d) => d.id)),
    getWishlistedDesignIds(session?.user?.id),
  ]);

  return (
    <section className="relative py-24">
      <Container>
        <div className="flex flex-col items-end justify-between gap-6 md:flex-row">
          <SectionHeader
            align="left"
            eyebrow="Öne Çıkanlar"
            title="Son 30 günün en çok basılanları"
            subtitle="Topluluğun ve resmi katalogun en sevilen tasarımları."
          />
          <Link
            href="/designs"
            className="text-sm text-[var(--color-brand-2)] hover:underline"
          >
            Tüm katalog →
          </Link>
        </div>
        <Reveal
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          stagger
        >
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
