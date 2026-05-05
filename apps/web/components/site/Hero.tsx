import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Upload, ShoppingBag } from "lucide-react";

export function Hero() {
  return (
    <section className="relative">
      <Container className="relative pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
          <Link
            href="/ai"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            <Sparkles className="size-3" />
            Yeni — AI ile metinden 3D model
            <ArrowRight className="size-3" />
          </Link>

          <h1 className="h-display mt-6 text-balance text-5xl text-foreground sm:text-6xl md:text-[72px]">
            Tasarla, üret, bastır.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Hazır tasarımlardan seç, kendi STL&rsquo;ini yükle veya AI ile sıfırdan
            ürettir. Snapmaker U1 üzerinde çok renkli, çok materyalli baskı —
            kapına kadar.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/upload">
              <Button size="lg">
                <Upload className="size-4" />
                Dosyanı Yükle
              </Button>
            </Link>
            <Link href="/designs">
              <Button size="lg" variant="secondary">
                <ShoppingBag className="size-4" />
                Tasarımları Gör
              </Button>
            </Link>
          </div>
        </div>

        <ViewerMockup />
      </Container>
      <div className="border-b border-border" aria-hidden />
    </section>
  );
}

function ViewerMockup() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-muted-foreground/30" />
            <span className="size-2 rounded-full bg-muted-foreground/30" />
            <span className="size-2 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            model.stl · 18.4 MB
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            HAZIR
          </span>
        </div>

        <div className="grid gap-px bg-border md:grid-cols-[1fr_300px]">
          <div className="relative aspect-[16/10] bg-background md:aspect-auto">
            <div className="absolute inset-0 flex items-center justify-center">
              <ModelMockup />
            </div>
            <div className="absolute bottom-3 left-3 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
              <span>X 64.2</span>
              <span>Y 48.1</span>
              <span>Z 22.0</span>
            </div>
          </div>

          <div className="space-y-4 bg-card p-5">
            <PanelRow label="Materyal" value="PLA · Mat Siyah" />
            <PanelRow label="Kalite" value="Standart · 0.20mm" />
            <PanelRow label="Doluluk" value="%15 Gyroid" />
            <PanelRow label="Süre" value="2 sa 36 dk" mono />
            <PanelRow label="Filament" value="35 g" mono />
            <div className="border-t border-border pt-4">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Toplam
              </div>
              <div className="mt-1 font-display text-2xl font-semibold text-foreground">
                ₺248,50
              </div>
            </div>
            <Button size="md" className="w-full">
              Sepete Ekle
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function ModelMockup() {
  return (
    <svg
      viewBox="0 0 320 220"
      className="h-[80%] w-[70%]"
      aria-hidden
    >
      <defs>
        <linearGradient id="g-top" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="hsl(217 91% 70%)" />
          <stop offset="1" stopColor="hsl(217 91% 55%)" />
        </linearGradient>
        <linearGradient id="g-left" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="hsl(217 91% 40%)" />
          <stop offset="1" stopColor="hsl(217 91% 28%)" />
        </linearGradient>
        <linearGradient id="g-right" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="hsl(217 91% 50%)" />
          <stop offset="1" stopColor="hsl(217 91% 35%)" />
        </linearGradient>
      </defs>
      <g transform="translate(40,40)">
        {[0, 14, 28, 42].map((z) => (
          <g key={z} transform={`translate(0,${-z})`} opacity={1 - z / 90}>
            <polygon points="120,0 240,60 120,120 0,60" fill="url(#g-top)" />
            <polygon points="0,60 120,120 120,160 0,100" fill="url(#g-left)" />
            <polygon points="240,60 120,120 120,160 240,100" fill="url(#g-right)" />
          </g>
        ))}
      </g>
    </svg>
  );
}
