import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Eski iç tasarım detayları gizli — katalog Shopier ürünlerini /urun/[id]
// üzerinden gösteriyor. Doğrudan gelenler kataloğa yönlendirilir.
export default function LegacyDesignPage() {
  redirect("/designs");
}
