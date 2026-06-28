import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Kredi/bakiye kullanıcıdan tamamen gizli (AI üret + dosya yükle kapalı).
export default function CreditsPage() {
  redirect("/account");
}
