import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Type, ArrowRight } from "lucide-react";

export function AISection() {
  return (
    <section className="relative py-20 md:py-28">
      <Container>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="grid items-stretch lg:grid-cols-2">
            <div className="p-8 sm:p-12 md:p-14">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Meshy AI
              </div>
              <h2 className="h-display mt-3 text-balance text-3xl text-foreground sm:text-4xl">
                Aklındaki şeyi tarif et, 3 boyutta gör.
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                Kredi al, yazı yaz veya görsel yükle. AI 30 saniyede sana hazır
                model üretsin. Beğendiğini doğrudan üretime ver.
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
                <div className="bg-card p-4">
                  <Type className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  <dt className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                    Yazıdan
                  </dt>
                  <dd className="mt-0.5 font-display text-lg font-semibold text-foreground">
                    10 kredi
                  </dd>
                </div>
                <div className="bg-card p-4">
                  <ImageIcon className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  <dt className="mt-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                    Görselden
                  </dt>
                  <dd className="mt-0.5 font-display text-lg font-semibold text-foreground">
                    25 kredi
                  </dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/ai">
                  <Button size="md" className="w-full sm:w-auto">
                    AI ile Üret
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="md" variant="secondary" className="w-full sm:w-auto">
                    Kredi Paketleri
                  </Button>
                </Link>
              </div>
            </div>

            <div className="border-t border-border bg-background p-6 lg:border-l lg:border-t-0">
              <div className="rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Yeni Üretim · Yazı → 3D
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Meshy v6
                  </span>
                </div>
                <div className="space-y-4 p-4">
                  <div className="rounded-md border border-border bg-secondary/40 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Prompt
                    </div>
                    <p className="mt-1 text-sm text-foreground">
                      “Sevimli astronot anahtarlık, kask yansıması var, düz yüzeyli, 4cm”
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`relative aspect-square overflow-hidden rounded-md border bg-secondary/40 ${
                          i === 1 ? "border-foreground/40" : "border-border"
                        }`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="size-10 rounded-full bg-foreground/10" />
                        </div>
                        {i === 1 && (
                          <div className="absolute right-1.5 top-1.5 rounded-sm bg-foreground px-1.5 py-0.5 text-[9px] font-medium uppercase text-background">
                            seçili
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <span>Kalan kredi: 240</span>
                    <span className="font-mono">~ 28 sn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
