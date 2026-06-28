/**
 * Normalized Shopier product — the shape the rest of the app consumes,
 * decoupled from Shopier's raw API payload. Mapped in lib/shopier/index.ts.
 */
export type ShopierProduct = {
  id: string;
  title: string;
  description: string | null;
  type: "physical" | "digital";
  /** Base list price in `currency`. */
  price: number;
  /** Discounted price when the product has an active discount, else null. */
  discountedPrice: number | null;
  hasDiscount: boolean;
  /** What the buyer actually pays: discountedPrice ?? price. */
  effectivePrice: number;
  currency: string; // TRY | USD | EUR
  shippingPrice: number | null;
  inStock: boolean;
  stockQuantity: number | null;
  /** Image URLs, ordered by Shopier `placement`. */
  images: string[];
  thumbnail: string | null;
  categories: string[];
  /** Public Shopier storefront URL where the buyer completes purchase. */
  url: string | null;
};

export type ShopierListResult = {
  products: ShopierProduct[];
  /** True when the products are dev fixtures, not live Shopier data. */
  isFixture: boolean;
};
