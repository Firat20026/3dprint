import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI ile Üret — Yakında",
  description: "AI ile 3D model üretimi yakında tekrar açılacak.",
  robots: { index: false },
};

// AI üretim (Meshy) akışı geçici olarak kapalı. Kullanıcı giremez, kredi
// harcamaz. Eski form `components/ai/AIGenerateForm` repoda duruyor; tekrar
// açmak için bu sayfayı eski haline döndürmek yeterli.
export default function AIPage() {
  return (
    <ComingSoon
      eyebrow="AI ile üret"
      title="Yakında"
      description="Metin veya görselden 3D model üretimi şu an bakımda. Çok yakında tekrar açılıyor. O zamana kadar hazır tasarım kataloğumuza göz atabilirsin."
    />
  );
}
