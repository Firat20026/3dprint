import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Block private + admin areas from crawlers — and the file-server,
        // which would otherwise expose user uploads via Google.
        disallow: [
          "/admin",
          "/account",
          "/checkout",
          "/api",
          "/login",
          "/register",
          "/render-internal",
        ],
      },
    ],
    sitemap: SITE_URL ? `${SITE_URL}/sitemap.xml` : undefined,
  };
}
