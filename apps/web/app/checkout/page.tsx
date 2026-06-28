import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Site-içi checkout geçici olarak gizli — ödeme Shopier'de yapılıyor.
export default function CheckoutPage() {
  redirect("/designs");
}
