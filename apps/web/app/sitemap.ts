/**
 * /sitemap.xml — static marketing pages + every PUBLISHED design.
 *
 * Forced dynamic so the request-time response includes fresh data and the
 * Docker build step doesn't try to prerender it (the DB is unreachable
 * during `next build`). Output is cached for an hour at the edge per
 * `revalidate`.
 */
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const SITE_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!SITE_URL) return [];

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/designs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/upload`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/ai`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/pricing`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/how-it-works`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/legal/kvkk`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/legal/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Belt-and-suspenders: even if the DB hiccups at request time we still
  // serve the static pages instead of returning a 500.
  let designs: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    designs = await prisma.design.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1000,
    });
  } catch {
    designs = [];
  }

  const designPages: MetadataRoute.Sitemap = designs.map((d) => ({
    url: `${SITE_URL}/designs/${d.slug}`,
    lastModified: d.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...designPages];
}
