import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Ürünler artık /designs'teki gömülü Shopier mağazasında gösteriliyor;
// ayrı ürün detay sayfası kullanılmıyor.
export default function ProductRedirect() {
  redirect("/designs");
}
