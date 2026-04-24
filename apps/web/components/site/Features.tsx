import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export function Showcase() {
  return (
    <section className="relative py-24">
      <Container>
        <div className="flex flex-col items-end justify-between gap-6 md:flex-row">
          <SectionHeader
            align="left"
            eyebrow="Hazır Tasarımlar"
            title="Anahtarlık · Stand · Oyuncak"
            subtitle="Ödeme yap, biz basalım. Renk ve materyal seçimi senin."
          />
          <Badge tone="accent">Yeni eklendi</Badge>
        </div>
        <Reveal className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger>
          {SHOWCASE.map((p) => (
            <ProductMockCard key={p.title} {...p} />
          ))}
        </Reveal>
      </Container>
    </section>
  );
}

const SHOWCASE = [
  { title: "Modüler Kalemlik", price: 89, time: "2 sa", swatches: ["#0a0a0b", "#3b82f6", "#f59e0b"] },
  { title: "Telefon Standı", price: 64, time: "1 sa 20 dk", swatches: ["#1a1a1a", "#22c55e"] },
  { title: "Lego Anahtarlık", price: 25, time: "32 dk", swatches: ["#ef4444", "#f5f5f7", "#3b82f6"] },
  { title: "Kupa Altlığı (×4)", price: 110, time: "3 sa 10 dk", swatches: ["#9b9ba3", "#0a0a0b"] },
];

function ProductMockCard({
  title,
  price,
  time,
  swatches,
}: {
  title: string;
  price: number;
  time: string;
  swatches: string[];
}) {
  return (
    <Card className="group hover-lift overflow-hidden hover:border-[var(--color-brand)]/40">
      <div className="relative aspect-[5/4] overflow-hidden bg-[var(--color-bg)]">
        <div className="absolute inset-0 bg-dot-grid opacity-60" />
        <div
          aria-hidden
          className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-80"
          style={{
            background:
              "radial-gradient(closest-side at 50% 60%, color-mix(in oklab, var(--color-brand) 25%, transparent), transparent 70%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-24 rounded-[18px] border border-[var(--color-border-strong)] bg-gradient-to-br from-[var(--color-surface-3)] to-[var(--color-surface)] shadow-2xl transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" />
        </div>
        <div className="absolute right-3 top-3">
          <Badge tone="brand">{time}</Badge>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--color-text)]">{title}</h3>
          <span className="text-sm font-semibold text-[var(--color-text)]">
            ₺{price}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {swatches.map((s) => (
            <span
              key={s}
              className="size-3.5 rounded-full border border-[var(--color-border-strong)]"
              style={{ background: s }}
            />
          ))}
          <span className="ml-1 text-xs text-[var(--color-text-subtle)]">
            +{swatches.length} renk
          </span>
        </div>
      </div>
    </Card>
  );
}
