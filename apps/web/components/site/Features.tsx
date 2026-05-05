import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/site/HowItWorks";
import { Reveal } from "@/components/site/Reveal";
import {
  Layers3,
  Palette,
  Cpu,
  Boxes,
  ShieldCheck,
  Gauge,
} from "lucide-react";

const features = [
  {
    icon: Layers3,
    title: "Gerçek Slicing",
    body: "OrcaSlicer CLI dosyayı saniyeler içinde dilimler. Tahmin değil, kesin gram & saat.",
  },
  {
    icon: Palette,
    title: "4 Renk · 4 Materyal",
    body: "Snapmaker U1 IDEX sistemi sayesinde aynı baskıda 4 farklı renk veya materyal.",
  },
  {
    icon: Cpu,
    title: "Meshy AI",
    body: "Yazıdan veya görselden 3D model üret. Krediler ile öde, beğen, bastır.",
  },
  {
    icon: Boxes,
    title: "Hazır Katalog",
    body: "Düzenli güncellenen tasarım kataloğu. Yakında topluluk marketplace'i.",
  },
  {
    icon: Gauge,
    title: "Esnek Kalite",
    body: "Hızlı, Standart, Yüksek presetleri + 0.08mm'ye kadar layer height.",
  },
  {
    icon: ShieldCheck,
    title: "Türkiye Ödeme",
    body: "iyzico ile güvenli kart ödemesi, taksit desteği. Türkiye geneli kargo.",
  },
];

export function Features() {
  return (
    <section className="relative py-20 md:py-28">
      <Container>
        <SectionHeader
          eyebrow="Öne Çıkan"
          title="Profesyonel hassasiyet, sade akış."
          subtitle="Bir tıkla anlık fiyat, dilersen detaylı kontrol. Profesyonel slicer'ın gücü, e-ticaret rahatlığı."
        />
        <Reveal className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3" stagger>
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-card p-7 transition-colors"
            >
              <f.icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
              <h3 className="mt-6 text-base font-semibold tracking-tight text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
