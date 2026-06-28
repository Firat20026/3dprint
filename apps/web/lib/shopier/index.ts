import "server-only";
import type { ShopierProduct, ShopierListResult } from "./types";
import { FIXTURE_PRODUCTS } from "./fixtures";

export type { ShopierProduct, ShopierListResult } from "./types";

/**
 * Shopier Developer API (REST) client — read-only product catalog.
 *
 * Auth: Personal Access Token (PAT) as `Authorization: Bearer <token>`.
 * Base: https://api.shopier.com/v1 (override with SHOPIER_API_BASE).
 *
 * We only READ products here — Shopier's REST API cannot create payments, so
 * "buy" links send the buyer to the product's public Shopier page
 * (`product.url`) where Shopier handles cart + checkout.
 *
 * Fixture fallback (SHOPIER_FIXTURES):
 *   - "on"   → always return demo fixtures (offline UI work)
 *   - "off"  → live only; on error/empty return []
 *   - "auto" → (default) live; if token missing OR live fails/empty AND not
 *              in production, fall back to fixtures so the UI stays visible.
 *              In production, "auto" never shows fixtures.
 */

const BASE = (process.env.SHOPIER_API_BASE || "https://api.shopier.com/v1").replace(/\/$/, "");
const TOKEN = process.env.SHOPIER_API_TOKEN || "";
const FEATURED_SELECTION_ID = process.env.SHOPIER_FEATURED_SELECTION_ID || "";
const FIXTURES_MODE = (process.env.SHOPIER_FIXTURES || "auto").toLowerCase();
const REVALIDATE_SECONDS = Number(process.env.SHOPIER_REVALIDATE ?? 60);

export function isShopierConfigured(): boolean {
  return TOKEN.length > 0;
}

/** Decide whether to serve fixtures, given that live data was unavailable. */
function fixturesAllowed(): boolean {
  if (FIXTURES_MODE === "on") return true;
  if (FIXTURES_MODE === "off") return false;
  // auto
  if (process.env.NODE_ENV === "production") return false;
  return true;
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

type RawMedia = { url?: string; placement?: number };
type RawCategory = { id?: string; title?: string };
type RawPriceData = {
  currency?: string;
  price?: string | number;
  discount?: boolean;
  discountedPrice?: string | number;
  shippingPrice?: string | number;
};
type RawProduct = {
  id?: string | number;
  title?: string;
  description?: string;
  type?: string;
  priceData?: RawPriceData;
  stockStatus?: string;
  stockQuantity?: number;
  media?: RawMedia[];
  categories?: RawCategory[];
  url?: string;
};

function normalize(raw: RawProduct | null | undefined): ShopierProduct | null {
  if (!raw || raw.id == null) return null;
  const pd = raw.priceData ?? {};
  const price = num(pd.price);
  const discounted =
    pd.discount && pd.discountedPrice != null ? num(pd.discountedPrice) : null;
  const hasDiscount = discounted != null && discounted > 0 && discounted < price;

  const media = Array.isArray(raw.media) ? [...raw.media] : [];
  media.sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99));
  const images = media.map((m) => m.url).filter((u): u is string => !!u);

  const categories = Array.isArray(raw.categories)
    ? raw.categories.map((c) => c.title).filter((t): t is string => !!t)
    : [];

  return {
    id: String(raw.id),
    title: raw.title?.trim() || "Ürün",
    description: raw.description?.trim() || null,
    type: raw.type === "digital" ? "digital" : "physical",
    price,
    discountedPrice: hasDiscount ? discounted : null,
    hasDiscount,
    effectivePrice: hasDiscount ? (discounted as number) : price,
    currency: pd.currency || "TRY",
    shippingPrice: pd.shippingPrice != null ? num(pd.shippingPrice) : null,
    inStock: raw.stockStatus ? raw.stockStatus === "inStock" : true,
    stockQuantity: typeof raw.stockQuantity === "number" ? raw.stockQuantity : null,
    images,
    thumbnail: images[0] ?? null,
    categories,
    url: raw.url || null,
  };
}

class ShopierError extends Error {}

type QueryValue = string | number | boolean | string[] | undefined;

async function shopierGet(
  path: string,
  params: Record<string, QueryValue> = {},
): Promise<unknown> {
  if (!TOKEN) throw new ShopierError("SHOPIER_API_TOKEN not set");

  const url = new URL(BASE + path);
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) url.searchParams.append(key, String(v));
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ShopierError(`Shopier ${res.status} on ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

/** Shopier list endpoints may return a bare array or { data: [...] }. */
function asArray(raw: unknown): RawProduct[] {
  if (Array.isArray(raw)) return raw as RawProduct[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of ["data", "products", "items", "results"]) {
      if (Array.isArray(obj[key])) return obj[key] as RawProduct[];
    }
  }
  return [];
}

function logShopier(e: unknown) {
  console.warn("[shopier]", e instanceof Error ? e.message : e);
}

async function fetchAllRawProducts(): Promise<RawProduct[]> {
  const all: RawProduct[] = [];
  // Store is small; cap at 4 pages (200 products) to bound work.
  for (let page = 1; page <= 4; page++) {
    const raw = await shopierGet("/products", { limit: 50, page, sort: "dateDesc" });
    const arr = asArray(raw);
    all.push(...arr);
    if (arr.length < 50) break;
  }
  return all;
}

/** Full published catalog. Page-level code does in-memory search/category
 *  filtering since the store is small. */
export async function listProducts(): Promise<ShopierListResult> {
  try {
    const raw = await fetchAllRawProducts();
    const products = raw
      .map(normalize)
      .filter((p): p is ShopierProduct => p !== null);
    if (products.length === 0 && fixturesAllowed()) {
      return { products: FIXTURE_PRODUCTS, isFixture: true };
    }
    return { products, isFixture: false };
  } catch (e) {
    logShopier(e);
    if (fixturesAllowed()) return { products: FIXTURE_PRODUCTS, isFixture: true };
    return { products: [], isFixture: false };
  }
}

/** Featured products for the homepage — from the configured Shopier selection
 *  (seçki) when SHOPIER_FEATURED_SELECTION_ID is set, else newest products. */
export async function listFeaturedProducts(limit = 8): Promise<ShopierListResult> {
  try {
    const raw = await shopierGet("/products", {
      limit,
      sort: "dateDesc",
      selectionId: FEATURED_SELECTION_ID || undefined,
    });
    const products = asArray(raw)
      .map(normalize)
      .filter((p): p is ShopierProduct => p !== null)
      .slice(0, limit);
    if (products.length === 0 && fixturesAllowed()) {
      return { products: FIXTURE_PRODUCTS.slice(0, limit), isFixture: true };
    }
    return { products, isFixture: false };
  } catch (e) {
    logShopier(e);
    if (fixturesAllowed()) {
      return { products: FIXTURE_PRODUCTS.slice(0, limit), isFixture: true };
    }
    return { products: [], isFixture: false };
  }
}

export async function getProduct(id: string): Promise<ShopierProduct | null> {
  try {
    const raw = await shopierGet(`/products/${encodeURIComponent(id)}`);
    return normalize(raw as RawProduct);
  } catch (e) {
    logShopier(e);
    if (fixturesAllowed()) {
      return FIXTURE_PRODUCTS.find((p) => p.id === id) ?? null;
    }
    return null;
  }
}

const CURRENCY_SYMBOL: Record<string, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
};

/** Format like the rest of the app: `₺199.00`. Symbol prefixed for TRY. */
export function formatMoney(amount: number, currency = "TRY"): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? "";
  return `${symbol}${amount.toFixed(2)}`;
}
