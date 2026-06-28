import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Site-içi sepet/checkout akışı geçici olarak gizli — satın alma ürünün
// Shopier sayfasında tamamlanıyor. Doğrudan gelenler kataloğa yönlendirilir.
export default function CartPage() {
  redirect("/designs");
}
