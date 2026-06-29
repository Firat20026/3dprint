import "server-only";
import { prisma } from "@/lib/db";
import type { CatalogProduct } from "@prisma/client";

/**
 * Admin-managed product catalog. Products are entered manually in the admin
 * panel (title, price, image URL, Shopier buy link). The storefront lists
 * them; "Satın Al" sends the buyer to the product's Shopier page (buyUrl)
 * where Shopier handles cart + payment.
 *
 * This is the data source for /designs, the homepage "Öne Çıkanlar" and the
 * product detail page — replacing the (currently blocked) Shopier REST API.
 */

export type Product = {
  id: string;
  title: string;
  description: string | null;
  type: "physical";
  /** Struck-through list price (== effectivePrice when there's no discount). */
  price: number;
  discountedPrice: number | null;
  hasDiscount: boolean;
  /** What the buyer pays. */
  effectivePrice: number;
  currency: string;
  shippingPrice: number | null;
  inStock: boolean;
  stockQuantity: number | null;
  images: string[];
  thumbnail: string | null;
  categories: string[];
  /** Shopier product page link where the purchase is completed. */
  url: string | null;
};

function mapRow(p: CatalogProduct): Product {
  const price = Number(p.priceTRY);
  const old = p.oldPriceTRY != null ? Number(p.oldPriceTRY) : null;
  const hasDiscount = old != null && old > price;

  const extra = Array.isArray(p.imagesJson)
    ? (p.imagesJson as unknown[]).filter((u): u is string => typeof u === "string")
    : [];
  const images = [p.imageUrl, ...extra].filter((u): u is string => !!u);

  return {
    id: p.id,
    title: p.title,
    description: p.description,
    type: "physical",
    price: hasDiscount ? (old as number) : price,
    discountedPrice: hasDiscount ? price : null,
    hasDiscount,
    effectivePrice: price,
    currency: "TRY",
    shippingPrice: null,
    inStock: p.inStock,
    stockQuantity: null,
    images,
    thumbnail: images[0] ?? null,
    categories: p.category ? [p.category] : [],
    url: p.buyUrl,
  };
}

/** All active products, newest/sortOrder first. */
export async function listProducts(): Promise<Product[]> {
  try {
    const rows = await prisma.catalogProduct.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return rows.map(mapRow);
  } catch {
    return [];
  }
}

/** Active + featured products for the homepage "Öne Çıkanlar". */
export async function listFeaturedProducts(limit = 8): Promise<Product[]> {
  try {
    const rows = await prisma.catalogProduct.findMany({
      where: { isActive: true, featured: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
    });
    return rows.map(mapRow);
  } catch {
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const row = await prisma.catalogProduct.findFirst({
      where: { id, isActive: true },
    });
    return row ? mapRow(row) : null;
  } catch {
    return null;
  }
}

const CURRENCY_SYMBOL: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€" };

/** Format like the rest of the app: `₺199.00`. */
export function formatMoney(amount: number, currency = "TRY"): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? "";
  return `${symbol}${amount.toFixed(2)}`;
}
