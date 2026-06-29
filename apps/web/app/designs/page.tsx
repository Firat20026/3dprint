import { redirect } from "next/navigation";
import { STORE_URL } from "@/lib/store";

export const dynamic = "force-dynamic";

// Katalog Shopier mağazasında — "Tasarımlar"a gelen herkesi oraya yönlendir.
export default function DesignsPage() {
  redirect(STORE_URL);
}
