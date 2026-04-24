import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Reveal } from "@/components/site/Reveal";
import { Upload, Wand2, Truck } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Upload,
    title: "Modeli Hazırla",
    body: "Hazır tasarımlardan seç, STL/3MF dosyanı yükle ya da prompt yazıp AI ile ürettir.",
  },
  {
    n: "02",
    icon: Wand2,
    title: "Anında Fiyat",
    body: "OrcaSlicer dosyayı saniyeler içinde dilimler. Materyal, renk, kaliteye göre kesin fiyat görürsün.",
  },
  {
    n: "03",
    icon: Truck,
    title: "Kapına Gelsin",
    body: "Türkiye geneli kargo. 500₺ üzeri siparişlerde ücretsiz. Sipariş durumunu canlı takip et.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24">
      <Container>
        <SectionHeader
          eyebrow="Nasıl Çalışır"
          title="Üç adımda elinde."
          subtitle="Karmaşık slicing yazılımları, dosya formatları, malzeme hesapları senin derdin değil. Sen seç, biz basalım."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} variant="up" delay={i * 90}>
              <Card className="group hover-lift h-full hover:border-[var(--color-brand)]/40">
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="inline-flex size-12 items-center justify-center rounded-[12px] bg-[color-mix(in_oklab,var(--color-brand)_18%,transparent)] text-[var(--color-brand-2)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]">
                      <s.icon className="size-6" />
                    </div>
                    <span className="font-display text-3xl text-[var(--color-border-strong)] transition-colors duration-300 group-hover:text-[var(--color-brand-2)]/60">
                      {s.n}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight text-[var(--color-text)]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {s.body}
                  </p>
                </CardBody>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal
      className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}
      variant="up"
    >
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2 className="h-display mt-3 text-4xl text-[var(--color-text)] sm:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
