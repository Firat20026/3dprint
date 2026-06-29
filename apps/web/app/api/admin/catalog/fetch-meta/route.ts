/**
 * POST /api/admin/catalog/fetch-meta  { url }
 *
 * Admin-only. Fetches a Shopier product page and extracts title/image/
 * description/price from its OpenGraph + meta + JSON-LD tags so the admin can
 * paste a link and have the product form pre-filled. Best-effort: any field it
 * can't find comes back null and the admin fills it manually.
 *
 * SSRF guard: only https://*.shopier.com URLs are fetched.
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function meta(html: string, keys: string[]): string | null {
  for (const key of keys) {
    // property="og:title" content="..."  (either attribute order)
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name|itemprop)=["']${key}["'][^>]+content=["']([^"']+)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${key}["']`,
        "i",
      ),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return decodeEntities(m[1].trim());
    }
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ");
}

function parsePrice(raw: string | null): number | null {
  if (!raw) return null;
  // "1.234,56 TL" → 1234.56 ; "199.00" → 199
  const cleaned = raw.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;
  let normalized = cleaned;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    // 1.234,56 → 1234.56
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  }
  const n = parseFloat(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function priceFromJsonLd(html: string): number | null {
  const m = html.match(/"price"\s*:\s*"?([\d.,]+)"?/i);
  return m ? parsePrice(m[1]) : null;
}

export async function POST(req: Request) {
  await requireAdmin();

  const body = (await req.json().catch(() => null)) as { url?: string } | null;
  const url = body?.url?.trim();
  if (!url) {
    return NextResponse.json({ error: "url gerekli" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Geçersiz URL" }, { status: 400 });
  }
  if (
    parsed.protocol !== "https:" ||
    !/(^|\.)shopier\.com$/i.test(parsed.hostname)
  ) {
    return NextResponse.json(
      { error: "Sadece https://...shopier.com linkleri desteklenir" },
      { status: 400 },
    );
  }

  let html: string;
  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html",
      },
      // Don't cache — admin expects fresh data when pasting a link.
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Sayfa alınamadı (HTTP ${res.status})` },
        { status: 502 },
      );
    }
    html = await res.text();
  } catch {
    return NextResponse.json(
      { error: "Sayfaya ulaşılamadı" },
      { status: 502 },
    );
  }

  const title =
    meta(html, ["og:title", "twitter:title"]) ??
    (html.match(/<title>([^<]+)<\/title>/i)?.[1]
      ? decodeEntities(html.match(/<title>([^<]+)<\/title>/i)![1].trim())
      : null);
  const image = meta(html, ["og:image", "twitter:image", "image"]);
  const description = meta(html, ["og:description", "description"]);
  const price =
    parsePrice(meta(html, ["product:price:amount", "og:price:amount", "price"])) ??
    priceFromJsonLd(html);

  return NextResponse.json({ title, image, description, price });
}
