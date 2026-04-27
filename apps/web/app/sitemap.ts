/**
 * /sitemap.xml — static marketing pages + every PUBLISHED design.
 *
 * Next.js renders this on demand and caches per the `revalidate` value.
 * Designs change rarely; revalidate hourly so newly approved designs
 * appear in the next crawl without a deploy.
 */
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const SITE_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";

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

  const designs = await prisma.design.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 1000,
  });

  const designPages: MetadataRoute.Sitemap = designs.map((d) => ({
    url: `${SITE_URL}/designs/${d.slug}`,
    lastModified: d.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...designPages];
}
