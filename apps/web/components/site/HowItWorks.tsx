import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/site/Reveal";
import { Search, ShoppingBag, Truck } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Search,
    title: "Tasarımı Seç",
    body: "Hazır tasarım kataloğumuza göz at, beğendiğin ürünü aç.",
  },
  {
    n: "02",
    icon: ShoppingBag,
    title: "Shopier'de Sipariş Ver",
    body: "Satın al butonuyla Shopier'e geç, güvenli kart ödemesiyle siparişini tamamla.",
  },
  {
    n: "03",
    icon: Truck,
    title: "Kapına Gelsin",
    body: "Siparişini Snapmaker U1 ile basıp Türkiye geneli kargoyla gönderiyoruz.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-20 md:py-28">
      <Container>
        <SectionHeader
          eyebrow="Nasıl Çalışır"
          title="Üç adımda elinde."
          subtitle="Baskı ayarı, malzeme hesabı senin derdin değil. Sen seç, biz basıp gönderelim."
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} variant="up" delay={i * 60}>
              <div className="group h-full bg-card p-8 transition-colors">
                <div className="flex items-center justify-between">
                  <s.icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-8 text-base font-semibold tracking-tight text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
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
      {eyebrow && (
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </div>
      )}
      <h2 className="h-display mt-3 text-3xl text-foreground sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-3 text-pretty text-base leading-relaxed text-muted-foreground ${align === "center" ? "mx-auto max-w-xl" : "max-w-xl"}`}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
