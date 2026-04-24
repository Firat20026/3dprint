import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Image as ImageIcon, Type, ArrowRight } from "lucide-react";

export function AISection() {
  return (
    <section className="relative py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface-2)] to-[var(--color-surface)] p-8 md:p-14">
          <div
            aria-hidden
            className="absolute -right-32 -top-32 size-[420px] rounded-full animate-drift"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--color-accent) 30%, transparent), transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div className="absolute inset-0 bg-dot-grid opacity-30" />

          <div className="relative grid items-center gap-12 md:grid-cols-2">
            <div>
              <Badge tone="accent" className="mb-5">
                <Sparkles className="size-3" />
                Meshy AI
              </Badge>
              <h2 className="h-display text-4xl text-[var(--color-text)] sm:text-5xl">
                Aklındaki şeyi <br />
                <span className="animate-gradient-pan bg-gradient-to-r from-[var(--color-accent)] via-[#fbbf24] to-[var(--color-accent)] bg-clip-text text-transparent">
                  tarif et
                </span>
                ,
                <br /> 3 boyutta gör.
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]">
                Kredi al, yazı yaz veya görsel yükle. AI 30 saniyede sana hazır
                model üretsin. Beğendiğini doğrudan üretime ver.
              </p>

              <div className="mt-7 flex items-center gap-5 text-sm text-[var(--color-text-muted)]">
                <div className="flex items-center gap-2">
                  <Type className="size-4 text-[var(--color-brand-2)]" />
                  <span>
                    Yazıdan{" "}
                    <span className="font-semibold text-[var(--color-text)]">
                      10 kredi
                    </span>
                  </span>
                </div>
                <div className="h-4 w-px bg-[var(--color-border)]" />
                <div className="flex items-center gap-2">
                  <ImageIcon className="size-4 text-[var(--color-brand-2)]" />
                  <span>
                    Görselden{" "}
                    <span className="font-semibold text-[var(--color-text)]">
                      25 kredi
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <Link href="/ai">
                  <Button size="lg" variant="accent">
                    AI ile Üret
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline">
                    Kredi Paketleri
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mock prompt panel */}
            <div className="relative animate-float-sm">
              <div className="rounded-[20px] border border-[var(--color-border-strong)] bg-[var(--color-bg)]/80 p-5 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                  <span className="text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
                    Yeni Üretim · Yazı → 3D
                  </span>
                  <Badge tone="brand">Meshy v6</Badge>
                </div>
                <div className="mt-4 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
                    Prompt
                  </div>
                  <p className="mt-1.5 text-sm text-[var(--color-text)]">
                    “Sevimli astronot anahtarlık, kask yansıması var, düz yüzeyli, 4cm”
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`relative aspect-square overflow-hidden rounded-[10px] border bg-[var(--color-surface)] ${
                        i === 1
                          ? "animate-pulse-glow border-[var(--color-success)]/40"
                          : "border-[var(--color-border)]"
                      }`}
                    >
                      <div className="absolute inset-0 bg-dot-grid opacity-40" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="size-12 rounded-full animate-float-sm"
                          style={{
                            background: `radial-gradient(circle at 30% 30%, #fff, #${i === 1 ? "60a5fa" : i === 2 ? "f59e0b" : "22c55e"})`,
                            animationDelay: `${i * 0.3}s`,
                          }}
                        />
                      </div>
                      {i === 1 && (
                        <div className="absolute right-1.5 top-1.5">
                          <Badge tone="success">seçili</Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-text-subtle)]">
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                    Kalan kredi: 240
                  </span>
                  <span className="font-mono">~ 28 sn</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
