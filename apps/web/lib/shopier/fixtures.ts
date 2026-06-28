import type { ShopierProduct } from "./types";

/**
 * Dev/fallback fixtures — used when SHOPIER_API_TOKEN is missing, the live
 * products endpoint is unreachable, or the store has no products yet (so the
 * storefront UI is still visible during development). Never shown in
 * production unless SHOPIER_FIXTURES=on. See lib/shopier/index.ts.
 */
export const FIXTURE_PRODUCTS: ShopierProduct[] = [
  {
    id: "demo-1",
    title: "Geometrik Saksı — Orta Boy",
    description:
      "Modern geometrik desenli, drenaj delikli dekoratif saksı. Succulent ve küçük bitkiler için ideal. PLA, mat yüzey.",
    type: "physical",
    price: 249,
    discountedPrice: 199,
    hasDiscount: true,
    effectivePrice: 199,
    currency: "TRY",
    shippingPrice: 0,
    inStock: true,
    stockQuantity: 24,
    images: [
      "https://picsum.photos/seed/frint3d-pot/800/600",
      "https://picsum.photos/seed/frint3d-pot2/800/600",
    ],
    thumbnail: "https://picsum.photos/seed/frint3d-pot/800/600",
    categories: ["Dekorasyon"],
    url: "https://www.shopier.com/",
  },
  {
    id: "demo-2",
    title: "Masaüstü Kablo Düzenleyici (3'lü)",
    description:
      "Dağınık kablolara son. Masa kenarına yapışan, 3 kanallı kablo tutucu seti.",
    type: "physical",
    price: 129,
    discountedPrice: null,
    hasDiscount: false,
    effectivePrice: 129,
    currency: "TRY",
    shippingPrice: 39,
    inStock: true,
    stockQuantity: 80,
    images: ["https://picsum.photos/seed/frint3d-cable/800/600"],
    thumbnail: "https://picsum.photos/seed/frint3d-cable/800/600",
    categories: ["Organizasyon"],
    url: "https://www.shopier.com/",
  },
  {
    id: "demo-3",
    title: "Astronot Anahtarlık",
    description:
      "Sevimli astronot figürlü anahtarlık. Çok renkli baskı, dayanıklı PETG.",
    type: "physical",
    price: 89,
    discountedPrice: null,
    hasDiscount: false,
    effectivePrice: 89,
    currency: "TRY",
    shippingPrice: 39,
    inStock: true,
    stockQuantity: 150,
    images: ["https://picsum.photos/seed/frint3d-astro/800/600"],
    thumbnail: "https://picsum.photos/seed/frint3d-astro/800/600",
    categories: ["Hediyelik"],
    url: "https://www.shopier.com/",
  },
  {
    id: "demo-4",
    title: "Kulaklık Standı — Minimal",
    description:
      "Masaüstü için sade kulaklık standı. Kaymaz tabanlı, ağırlık dengeli.",
    type: "physical",
    price: 179,
    discountedPrice: 149,
    hasDiscount: true,
    effectivePrice: 149,
    currency: "TRY",
    shippingPrice: 0,
    inStock: false,
    stockQuantity: 0,
    images: ["https://picsum.photos/seed/frint3d-stand/800/600"],
    thumbnail: "https://picsum.photos/seed/frint3d-stand/800/600",
    categories: ["Aksesuar"],
    url: "https://www.shopier.com/",
  },
];
