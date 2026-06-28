import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Eski fiyatlandırma sayfası (baskı formülü + AI kredi paketleri) artık
// geçerli değil — ürünler Shopier üzerinden satılıyor. Menüden kaldırıldı;
// doğrudan gelenler kataloğa yönlendirilir. Eski içerik git geçmişinde.
export default function PricingPage() {
  redirect("/designs");
}
