import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Kullanıcı tasarım yükleme (pazaryeri) geçici olarak gizli.
export default function MyDesignsPage() {
  redirect("/account");
}
