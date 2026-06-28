import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Tasarımcı pazaryeri kazançları geçici olarak gizli.
export default function EarningsPage() {
  redirect("/account");
}
