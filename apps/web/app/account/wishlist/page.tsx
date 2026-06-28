import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Favoriler (iç tasarım kataloğuna bağlıydı) geçici olarak gizli.
export default function WishlistPage() {
  redirect("/account");
}
