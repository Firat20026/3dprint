import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ShoppingBag, ArrowUpRight } from "lucide-react";
import { STORE_URL } from "@/lib/store";

export function Hero() {
  return (
    <section className="relative">
      <Container className="relative pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
          <a
            href={STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            <Sparkles className="size-3" />
            Shopier mağazamız yayında
            <ArrowRight className="size-3" />
          </a>

          <h1 className="h-display mt-6 text-balance text-5xl text-foreground sm:text-6xl md:text-[72px]">
            Seç, sipariş ver, bastır.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Özenle seçilmiş hazır tasarımlardan beğen, Shopier güvencesiyle
            sipariş ver. Snapmaker U1 üzerinde çok renkli, çok materyalli baskı —
            kapına kadar.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={STORE_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg">
                <ShoppingBag className="size-4" />
                Shopier Mağazasına Git
                <ArrowUpRight className="size-4" />
              </Button>
            </a>
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
            frint3d · hazır tasarımlar
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">
            Snapmaker U1
          </span>
        </div>

        <div className="relative aspect-[16/9] bg-background">
          <div className="absolute inset-0 flex items-center justify-center">
            <ModelMockup />
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
            <span>Çok renkli</span>
            <span>4 materyal</span>
            <span>0.08mm katman</span>
          </div>
        </div>
      </div>
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
