import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/Reveal";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/watermelon-ui/animated-accordion";
import {
  Search,
  ShoppingBag,
  Cpu,
  Truck,
  Layers3,
  Palette,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function HowItWorksPage() {
  return (
    <Container className="py-12 animate-fade-in">
      <p className="eyebrow">Nasıl Çalışır</p>
      <h1 className="mt-3 h-display text-4xl md:text-5xl">
        Seçtiğin tasarım üç adımda kapında.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Sen kataloğumuzdan beğen, Shopier güvencesiyle sipariş ver — baskı,
        kalite kontrol ve kargoyu biz yönetelim.
      </p>

      {/* Three-step flow */}
      <section className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} variant="up" delay={i * 80}>
            <Card className="group hover-lift h-full hover:border-primary/40">
              <CardBody>
                <div className="flex items-start justify-between">
                  <span className="inline-flex size-12 items-center justify-center rounded-[12px] bg-[color-mix(in_oklab,var(--color-brand)_18%,transparent)] text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]">
                    <s.icon className="size-6" />
                  </span>
                  <span className="font-display text-3xl text-[var(--color-border-strong)]">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </CardBody>
            </Card>
          </Reveal>
        ))}
      </section>

      {/* Machine specs */}
      <section className="mt-20">
        <div className="grid gap-8 rounded-xl border border-border bg-card p-8 md:grid-cols-[1fr_1.4fr] md:p-10">
          <div>
            <Badge tone="brand" className="mb-4">
              <Cpu className="size-3" />
              Snapmaker U1
            </Badge>
            <h2 className="h-display text-3xl">
              Dört renk, dört materyal — tek baskı.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Tüm ürünler IDEX (bağımsız çift ekstrüder) + 4 slotlu renk
              değiştiricili Snapmaker U1 ile basılır. Katman yüksekliği
              0.08mm&apos;ye kadar iner.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            <SpecRow icon={Layers3} label="Baskı alanı" value="270 × 270 × 270 mm" />
            <SpecRow icon={Palette} label="Renk / Materyal" value="4× IDEX" />
            <SpecRow icon={Layers3} label="Min. katman" value="0.08 mm" />
            <SpecRow icon={Cpu} label="Desteklenen" value="PLA · PETG · TPU · ABS" />
          </ul>
        </div>
      </section>

      {/* Timeline */}
      <section className="mt-20">
        <h2 className="font-display text-2xl tracking-tight">
          Sipariş Zaman Çizelgesi
        </h2>
        <ol className="mt-8 space-y-5 border-l border-border pl-6">
          <TimelineItem
            title="Sipariş alındı"
            body="Shopier ödemen onaylandığında siparişin bize ulaşır ve baskı kuyruğuna girer."
            meta="0. dakika"
          />
          <TimelineItem
            title="Baskı başlıyor"
            body="Sıran geldiğinde Snapmaker U1 ürünü yazdırmaya başlar."
            meta="1–24 saat"
          />
          <TimelineItem
            title="Kalite kontrol"
            body="Baskı biter bitmez destekleri alınır, boyut ve yüzey kontrol edilir. Bozulma varsa tekrar basılır — sana ek yük yok."
            meta="Baskı sonrası"
          />
          <TimelineItem
            title="Kargolanır"
            body="Türkiye geneli kargoyla gönderilir. Kargo ve teslimat koşulları ürünün Shopier sayfasında belirtilir."
            meta="1–3 iş günü"
          />
        </ol>
      </section>

      {/* FAQ */}
      <section className="mt-20">
        <h2 className="font-display text-2xl tracking-tight">Sık Sorulanlar</h2>
        <Accordion
          type="single"
          collapsible
          className="mt-6 overflow-hidden rounded-xl border border-border bg-card"
        >
          {FAQ.map((q, i) => (
            <AccordionItem
              key={q.q}
              value={`item-${i}`}
              className="border-border px-5"
            >
              <AccordionTrigger className="text-foreground">
                {q.q}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                {q.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="mt-20 rounded-xl border border-border bg-card p-10 text-center">
        <h3 className="h-display text-3xl">Aradığın tasarım burada.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Kataloğu keşfet, beğendiğini Shopier güvencesiyle sipariş ver.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/designs">
            <Button size="lg">
              Tasarımları Gör
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>
    </Container>
  );
}

const STEPS = [
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
    body: "Ürününü Snapmaker U1 ile basıp kalite kontrolünden geçirir, kargoyla göndeririz.",
  },
];

const FAQ = [
  {
    q: "Nasıl sipariş veririm?",
    a: "Katalogdan beğendiğin ürünü aç ve 'Shopier'de Satın Al' butonuna tıkla. Ödemeni Shopier'in güvenli sayfasında kartınla tamamlarsın.",
  },
  {
    q: "Renk karışımlı tek bir parça mümkün mü?",
    a: "Evet. Snapmaker U1 üzerindeki 4 kafa sayesinde aynı parçada 4 farklı renk veya materyal yan yana basılabilir.",
  },
  {
    q: "Ne kadar sürede elime geçer?",
    a: "Baskı 1–24 saat (karmaşıklığa göre) + kargo 1–3 iş günü. Teslimat detayları ürünün Shopier sayfasında belirtilir.",
  },
  {
    q: "Baskı bozulursa ne olur?",
    a: "Bozulan baskıyı biz üstlenir ve tekrar basarız. Senin için ek ücret yok.",
  },
  {
    q: "Ödeme güvenli mi?",
    a: "Ödeme Shopier üzerinden alınır; kart bilgilerin Shopier'in güvenli ödeme sayfasında işlenir, alıcı koruması Shopier güvencesindedir.",
  },
];

function SpecRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers3;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-[10px] border border-border bg-secondary px-4 py-3">
      <Icon className="size-4 text-primary" />
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </li>
  );
}

function TimelineItem({
  title,
  body,
  meta,
}: {
  title: string;
  body: string;
  meta: string;
}) {
  return (
    <li className="relative">
      <span className="absolute -left-[31px] top-1.5 flex size-5 items-center justify-center rounded-full border border-primary/40 bg-background text-primary">
        <CheckCircle2 className="size-3.5" />
      </span>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <span className="font-mono text-xs text-muted-foreground/70">{meta}</span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </li>
  );
}
