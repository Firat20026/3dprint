import type { Metadata } from "next";
import Link from "next/link";
import { StoreEmbed } from "@/components/site/StoreEmbed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tasarım Kataloğu",
  description:
    "Hazır 3D baskı ürünleri — Shopier güvencesiyle sipariş ver. Dekorasyon, organizasyon, hediyelik ve daha fazlası.",
  openGraph: {
    title: "Tasarım Kataloğu — frint3d",
    description: "Hazır 3D baskı ürünleri. Shopier güvencesiyle sipariş ver.",
  },
};

const STORE_URL =
  process.env.SHOPIER_STORE_URL || "https://www.shopier.com/frint";

export default function DesignsPage() {
  return (
    <div className="animate-fade-in">
      <StoreEmbed
        src={STORE_URL}
        title="frint3d — Tasarım Kataloğu"
        className="h-[calc(100vh-4rem)] min-h-[640px]"
      />
      <noscript>
        <div className="p-6 text-center text-sm text-muted-foreground">
          Mağazayı görmek için{" "}
          <Link href={STORE_URL} className="underline">
            buraya tıkla
          </Link>
          .
        </div>
      </noscript>
    </div>
  );
}
