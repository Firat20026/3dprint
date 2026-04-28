import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { DesignCard } from "@/components/shop/DesignCard";
import { auth } from "@/lib/auth";
import { listWishlistDesigns } from "@/lib/wishlist";
import { getDesignRatingSummaries } from "@/lib/reviews";
import { Heart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?redirect=/account/wishlist");

  const items = await listWishlistDesigns(session.user.id);
  const visible = items.filter((it) => it.design.status === "PUBLISHED");
  const ratings = await getDesignRatingSummaries(visible.map((it) => it.design.id));

  return (
    <Container className="py-12 animate-fade-in">
      <p className="eyebrow">Hesap</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="h-display text-4xl md:text-5xl">Favorilerim</h1>
        <p className="text-xs text-[var(--color-text-subtle)]">
          {visible.length} tasarım
        </p>
      </div>
      <p className="mt-3 max-w-xl text-sm text-[var(--color-text-muted)]">
        Beğendiğin tasarımları kalp ikonuyla buraya kaydedebilirsin. Yayından
        kaldırılan tasarımlar listende gizlenir.
      </p>

      {visible.length === 0 ? (
        <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
          <Heart className="mx-auto size-8 text-[var(--color-text-subtle)]" />
          <p className="mt-3 font-display text-xl uppercase tracking-tight">
            Henüz favori yok
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Tasarımlara göz at, beğendiklerinin üzerindeki kalbe tıkla.
          </p>
          <Link
            href="/designs"
            className="mt-5 inline-flex h-10 items-center rounded-[var(--radius-button)] bg-[var(--color-brand)] px-4 text-sm font-medium text-white hover:bg-[var(--color-brand-2)]"
          >
            Tasarımları Keşfet →
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((it) => (
            <DesignCard
              key={it.id}
              design={it.design}
              rating={ratings.get(it.design.id)}
              wishlisted={true}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
