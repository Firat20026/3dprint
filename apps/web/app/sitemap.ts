/**
 * /sitemap.xml — public marketing pages only.
 *
 * AI/upload/pricing and the internal design/designer pages are currently
 * hidden (only the Shopier catalog is live), so they're excluded. Product
 * detail pages live on Shopier and aren't enumerated here.
 */
import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  if (!SITE_URL) return [];

  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/designs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/how-it-works`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/legal/kvkk`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/legal/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
