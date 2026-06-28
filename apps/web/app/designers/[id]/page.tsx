import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Tasarımcı pazaryeri profilleri geçici olarak gizli.
export default function DesignerProfilePage() {
  redirect("/designs");
}
