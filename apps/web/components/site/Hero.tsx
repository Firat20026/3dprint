import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Upload, ShoppingBag } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden animate-fade-in">
      {/* Background layers */}
      <div className="absolute inset-0 bg-dot-grid opacity-70" />
      <div
        aria-hidden
        className="absolute -top-32 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--color-brand) 22%, transparent), transparent 70%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-brand)]/40 to-transparent" />

      <Container className="relative pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <Badge tone="brand" className="mb-6">
            <Sparkles className="size-3" />
            Türkiye&rsquo;de 3D baskı, AI ile yeni boyut
          </Badge>

          <h1 className="h-display text-5xl text-[var(--color-text)] sm:text-6xl md:text-7xl lg:text-[84px]">
            Tasarla, üret,{" "}
            <span className="animate-gradient-pan bg-gradient-to-r from-[var(--color-brand-2)] via-[var(--color-brand)] to-[var(--color-accent)] bg-clip-text text-transparent">
              bastır.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[var(--color-text-muted)]">
            Hazır tasarımlardan seç, kendi STL&rsquo;ini yükle veya AI ile sıfırdan
            ürettir. Snapmaker U1 üzerinde çok renkli, çok materyalli baskı —
            kapına kadar.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/upload">
              <Button size="xl" className="min-w-[200px]">
                <Upload className="size-4" />
                Dosyanı Yükle
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/designs">
              <Button size="xl" variant="secondary" className="min-w-[200px]">
                <ShoppingBag className="size-4" />
                Tasarımları Gör
              </Button>
            </Link>
          </div>

          <div
            className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-[var(--color-text-subtle)]"
            data-stagger
          >
            <Stat label="Anlık Fiyat" value="30 sn" />
            <Divider />
            <Stat label="Renk / Materyal" value="4× IDEX" />
            <Divider />
            <Stat label="Maksimum Boyut" value="270mm³" />
            <Divider />
            <Stat label="Kargo" value="Türkiye geneli" />
          </div>
        </div>

        {/* Decorative 3D-ish viewer card */}
        <div className="relative mx-auto mt-16 max-w-5xl animate-float">
          <div
            aria-hidden
            className="absolute -inset-x-12 -inset-y-8 rounded-[28px] animate-glow-pulse"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--color-brand) 30%, transparent), transparent 70%)",
              filter: "blur(28px)",
            }}
          />
          <div className="relative overflow-hidden rounded-[24px] border border-[var(--color-border-strong)] bg-gradient-to-b from-[var(--color-surface-2)] to-[var(--color-surface)] shadow-2xl">
            <div className="beam-sweep" aria-hidden />
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#ff5f57]/80 animate-tick" style={{ animationDelay: "0s" }} />
                <span className="size-2.5 rounded-full bg-[#febc2e]/80 animate-tick" style={{ animationDelay: "0.2s" }} />
                <span className="size-2.5 rounded-full bg-[#28c840]/80 animate-tick" style={{ animationDelay: "0.4s" }} />
              </div>
              <div className="text-xs text-[var(--color-text-subtle)] font-mono">
                model.stl · 18.4 MB
              </div>
              <Badge tone="success">Hazır</Badge>
            </div>

            <div className="grid gap-px bg-[var(--color-border)] md:grid-cols-[1fr_320px]">
              {/* Viewer placeholder */}
              <div className="relative aspect-[16/10] bg-[var(--color-bg)] md:aspect-auto">
                <div className="absolute inset-0 bg-dot-grid opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ModelMockup />
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[11px] font-mono text-[var(--color-text-subtle)]">
                  <span>X 64.2</span>
                  <span>Y 48.1</span>
                  <span>Z 22.0</span>
                </div>
              </div>

              {/* Side panel mock */}
              <div className="space-y-5 bg-[var(--color-surface)] p-5">
                <PanelRow label="Materyal" value="PLA · Mat Siyah" swatch="#1a1a1a" />
                <PanelRow label="Kalite" value="Standart · 0.20mm" />
                <PanelRow label="Doluluk" value="%15 Gyroid" />
                <PanelRow label="Süre" value="2 sa 36 dk" mono />
                <PanelRow label="Filament" value="35 g" mono />
                <div className="border-t border-[var(--color-border)] pt-4">
                  <div className="text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
                    Toplam
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-3xl text-[var(--color-text)]">
                      ₺248,50
                    </span>
                    <Badge tone="brand">canlı hesap</Badge>
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
      </Container>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-left">
      <div className="font-display text-lg text-[var(--color-text)]">{value}</div>
      <div className="text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return <span className="hidden h-8 w-px bg-[var(--color-border)] sm:block" />;
}

function PanelRow({
  label,
  value,
  swatch,
  mono,
}: {
  label: string;
  value: string;
  swatch?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
        {label}
      </span>
      <span
        className={`flex items-center gap-2 text-sm text-[var(--color-text)] ${
          mono ? "font-mono" : ""
        }`}
      >
        {swatch && (
          <span
            className="size-3.5 rounded-full border border-[var(--color-border-strong)]"
            style={{ background: swatch }}
          />
        )}
        {value}
      </span>
    </div>
  );
}

/** Stylized isometric "model" placeholder until R3F viewer is wired up */
function ModelMockup() {
  return (
    <svg
      viewBox="0 0 320 220"
      className="h-[80%] w-[70%] animate-bob-rotate drop-shadow-[0_30px_40px_rgba(59,130,246,0.25)]"
      aria-hidden
    >
      <defs>
        <linearGradient id="g-top" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="g-left" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="g-right" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1e40af" />
        </linearGradient>
      </defs>
      {/* layered isometric stack */}
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
