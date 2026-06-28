import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dosya Yükle — Yakında",
  description: "Kendi STL/3MF dosyanı yükleyip bastırma özelliği yakında.",
  robots: { index: false },
};

// Dosya yükleme + slicing akışı geçici olarak kapalı. Kullanıcı giremez.
// Eski akış `components/upload/UploadFlow` repoda duruyor; tekrar açmak için
// bu sayfayı eski haline döndürmek yeterli.
export default function UploadPage() {
  return (
    <ComingSoon
      eyebrow="Kendi Dosyan"
      title="Yakında"
      description="STL/3MF dosyanı yükleyip bastırma özelliği şu an bakımda. Çok yakında tekrar açılıyor. O zamana kadar hazır tasarım kataloğumuza göz atabilirsin."
    />
  );
}
