import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { DesignCard } from "@/components/shop/DesignCard";
import { StarRating } from "@/components/reviews/StarRating";
import {
  getDesignerPublicProfile,
  listDesignerPublishedDesigns,
} from "@/lib/designers";
import { getDesignRatingSummaries } from "@/lib/reviews";
import { getWishlistedDesignIds } from "@/lib/wishlist";
import { auth } from "@/lib/auth";
import { CalendarDays, ExternalLink, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await getDesignerPublicProfile(id).catch(() => null);
  if (!profile) return { title: "Tasarımcı bulunamadı — frint3d" };

  const name = profile.name ?? "Tasarımcı";
  const description =
    profile.bio?.slice(0, 200) ??
    `${name}'in frint3d marketplace'teki tasarımları — ${profile.publishedDesignCount} yayında.`;

  return {
    title: `${name} — frint3d`,
    description,
    openGraph: {
      title: name,
      description,
      type: "profile",
      url: SITE_URL ? `${SITE_URL}/designers/${profile.id}` : undefined,
    },
  };
}

export default async function DesignerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getDesignerPublicProfile(id);
  if (!profile) notFound();

  const session = await auth();
  const [designs, wishlistedIds] = await Promise.all([
    listDesignerPublishedDesigns(profile.id),
    getWishlistedDesignIds(session?.user?.id),
  ]);
  const ratings = await getDesignRatingSummaries(designs.map((d) => d.id));

  const initial = (profile.name ?? "T").charAt(0).toUpperCase();
  const joined = profile.joinedAt.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
  });

  return (
    <Container className="py-12 animate-fade-in">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Ana Sayfa
        </Link>
        <span className="mx-2">/</span>
        <Link href="/designs" className="hover:text-foreground">
          Tasarımlar
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">
          {profile.name ?? "Tasarımcı"}
        </span>
      </nav>

      <header className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="inline-flex size-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[#1d4ed8] text-3xl font-semibold text-white">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Tasarımcı</p>
            <h1 className="mt-2 h-display text-3xl md:text-4xl">
              {profile.name ?? "Anonim Tasarımcı"}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {joined} tarihinde katıldı
              </span>
              <span>·</span>
              <span>{profile.publishedDesignCount} yayında tasarım</span>
              {profile.totalReviews > 0 && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <StarRating
                      value={profile.averageRating}
                      size={12}
                      hideCount
                    />
                    {profile.averageRating.toFixed(1)} ({profile.totalReviews})
                  </span>
                </>
              )}
            </div>
            {profile.websiteUrl && (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline"
              >
                <Globe className="size-3.5" />
                {profile.websiteUrl.replace(/^https?:\/\//, "")}
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
        {profile.bio && (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {profile.bio}
          </p>
        )}
      </header>

      <section className="mt-10">
        <h2 className="font-display text-xl uppercase tracking-tight">
          Tasarımları
        </h2>
        {designs.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Yayında tasarım yok.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {designs.map((d) => (
              <DesignCard
                key={d.id}
                design={d}
                rating={ratings.get(d.id)}
                wishlisted={wishlistedIds.has(d.id)}
              />
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
