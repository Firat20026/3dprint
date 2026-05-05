import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/Reveal";
import { getSettings } from "@/lib/settings";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/watermelon-ui/animated-accordion";
import {
  Upload,
  Cpu,
  Wand2,
  Truck,
  CreditCard,
  Layers3,
  Palette,
  ArrowRight,
  Boxes,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HowItWorksPage() {
  const settings = await getSettings();

  return (
    <Container className="py-12 animate-fade-in">
      <p className="eyebrow">Nasıl Çalışır</p>
      <h1 className="mt-3 h-display text-4xl md:text-5xl">
        Fikrinden elinize dört adım.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Slicing, malzeme seçimi, baskı ve kargo — hepsini biz yönetiriz. Sen
        sadece ne istediğini söyle.
      </p>

      {/* Four-step flow */}
      <section className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Three paths */}
      <section className="mt-20">
        <h2 className="font-display text-2xl tracking-tight">Üç Farklı Yol</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Nereden başlayacağına sen karar ver — hepsi aynı boru hattına akar.
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <PathCard
            icon={Boxes}
            title="Hazır Kataloğu Gez"
            body="Admin ve topluluk tarafından yüklenmiş tasarımlardan seç. Renk ve materyali değiştirerek özelleştir."
            href="/designs"
            cta="Tasarımları Gör"
            tone="brand"
          />
          <PathCard
            icon={Upload}
            title="Kendi Dosyanı Yükle"
            body="STL veya 3MF dosyanı bırak. OrcaSlicer arka planda gerçek gram ve süreyi hesaplar, kesin fiyat gelir."
            href="/upload"
            cta="Dosyanı Yükle"
            tone="brand"
          />
          <PathCard
            icon={Sparkles}
            title="AI ile Üret"
            body={`Metin yaz veya görsel yükle, Meshy AI 3D modeli üretsin. Metinden ${settings.meshyTextCost} kredi, görselden ${settings.meshyImageCost} kredi.`}
            href="/ai"
            cta="AI'ya Başla"
            tone="accent"
          />
        </div>
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
              IDEX (bağımsız çift ekstrüder) + 4 slotlu renk değiştirici. Katman
              yüksekliği 0.08mm&apos;ye kadar iner. 270mm³ yazdırma hacmi.
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
            title="Ödeme onaylandı"
            body="iyzico ödemeni doğrular, sipariş baskı kuyruğuna düşer. Anında e-posta gönderilir."
            meta="0. dakika"
          />
          <TimelineItem
            title="Baskı başlıyor"
            body="Sıran geldiğinde Snapmaker U1 modeli yazdırmaya başlar. Kalan süreyi hesabından canlı göster."
            meta="1–24 saat"
          />
          <TimelineItem
            title="Kalite kontrol"
            body="Baskı biter bitmez destekleri alınır, boyut ve yüzey kontrol edilir. Bozulma varsa tekrar basılır — sana yük yok."
            meta="Baskı sonrası"
          />
          <TimelineItem
            title="Kargolanır"
            body={`Türkiye geneli kargo. ₺${settings.shippingFlatTRY} sabit, ₺${settings.freeShippingThresholdTRY} üzeri ücretsiz. Takip numarası e-posta ile gelir.`}
            meta="1–3 iş günü"
          />
        </ol>
      </section>

      {/* FAQ — Watermelon animated-accordion */}
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
        <h3 className="h-display text-3xl">Başlamaya hazır mısın?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Canlı fiyat için dosyanı yükle — 30 saniyede sonuç.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/upload">
            <Button size="lg">
              Dosyanı Yükle
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="secondary">
              Fiyatlandırma
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
    icon: Upload,
    title: "Modeli Seç veya Yükle",
    body: "Katalogdan al, STL/3MF yükle ya da AI'ya bir prompt ver. Hepsi aynı fiyat boru hattına girer.",
  },
  {
    n: "02",
    icon: Wand2,
    title: "Anında Fiyat",
    body: "OrcaSlicer dosyanı dilimler, gerçek gram ve saat üstüne şeffaf formül uygulanır.",
  },
  {
    n: "03",
    icon: CreditCard,
    title: "Güvenli Ödeme",
    body: "iyzico ile kart veya taksit. Ödeme onaylandığı an sipariş baskı kuyruğuna düşer.",
  },
  {
    n: "04",
    icon: Truck,
    title: "Kapına Gelsin",
    body: "Kalite kontrolden geçen parça kargoya verilir, takip numarası e-postana gelir.",
  },
];

const FAQ = [
  {
    q: "Hangi dosya formatlarını kabul ediyorsunuz?",
    a: "STL ve 3MF. 3MF tercih edilir — içerisinde renk ve preset bilgisi taşır. Maks. dosya 100MB.",
  },
  {
    q: "Renk karışımlı tek bir parça bastırabilir miyim?",
    a: "Evet. Snapmaker U1 üzerindeki 4 kafa sayesinde aynı parçada 4 farklı renk veya materyal yan yana basılır. 3MF dosyanda segment renklerini tanımlarsan olduğu gibi basarız.",
  },
  {
    q: "Tahmini fiyat mı, kesin fiyat mı?",
    a: "Kesin. Ücret gerçek slice sonucuna göre çıkar; 'yaklaşık' ya da 'ortalama' hesap yapmıyoruz. Fiyat kırılımını sepete eklemeden önce görürsün.",
  },
  {
    q: "Ne kadar sürede elime geçer?",
    a: "Baskı 1–24 saat (karmaşıklığa göre) + kargo 1–3 iş günü. Yoğun dönemde hesabın üzerinden canlı durumu takip edebilirsin.",
  },
  {
    q: "Baskı bozulursa ne olur?",
    a: "Bozulan baskıyı biz üstlenir ve tekrar basar, sana aynı fiyat üzerinden teslim ederiz. Senin için ek ücret yok.",
  },
  {
    q: "Kendi tasarımımı satabilir miyim?",
    a: "Evet. Hesabından 'Tasarımlarım' → yeni gönderi. Admin onayından sonra katalogda herkes basabilir, her satıştan belirlediğin kâr markupı sana yansır.",
  },
];

function PathCard({
  icon: Icon,
  title,
  body,
  href,
  cta,
  tone,
}: {
  icon: typeof Upload;
  title: string;
  body: string;
  href: string;
  cta: string;
  tone: "brand" | "accent";
}) {
  const color =
    tone === "accent"
      ? "bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)] text-muted-foreground"
      : "bg-[color-mix(in_oklab,var(--color-brand)_18%,transparent)] text-primary";
  return (
    <Card className="group hover-lift flex h-full flex-col hover:border-primary/40">
      <CardBody className="flex flex-1 flex-col">
        <span
          className={`inline-flex size-11 items-center justify-center rounded-[10px] transition-transform duration-300 group-hover:scale-110 ${color}`}
        >
          <Icon className="size-5" />
        </span>
        <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
        <div className="mt-auto pt-5">
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium font-medium text-foreground hover:underline"
          >
            {cta}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

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
        <h3 className="text-base font-semibold text-foreground">
          {title}
        </h3>
        <span className="font-mono text-xs text-muted-foreground/70">
          {meta}
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
    </li>
  );
}
