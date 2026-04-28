import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
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
    <section className="relative py-24">
      <Container>
        <SectionHeader
          eyebrow="Öne Çıkan"
          title="Profesyonel hassasiyet, kullanıcı dostu akış."
          subtitle="Bir tıkla anlık fiyat, dilersen detaylı kontrol. Profesyonel slicer'ın gücü, e-ticaret rahatlığı."
        />
        <Reveal className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger>
          {features.map((f) => (
            <Card
              key={f.title}
              className="group hover-lift relative overflow-hidden hover:border-[var(--color-brand)]/40"
            >
              <CardBody>
                <div className="inline-flex size-11 items-center justify-center rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-brand-2)] transition-all duration-300 group-hover:scale-110 group-hover:border-[var(--color-brand)]/60 group-hover:bg-[color-mix(in_oklab,var(--color-brand)_12%,var(--color-surface-2))]">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-[var(--color-text)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {f.body}
                </p>
              </CardBody>
            </Card>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}

