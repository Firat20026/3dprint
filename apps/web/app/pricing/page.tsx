import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import {
  Sparkles,
  Package,
  Truck,
  Calculator,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const [settings, packs, materials] = await Promise.all([
    getSettings(),
    prisma.creditPack.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.material.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <Container className="py-12 animate-fade-in">
      <p className="eyebrow">Fiyatlandırma</p>
      <h1 className="mt-3 h-display text-4xl md:text-5xl">
        Şeffaf fiyat, sürpriz yok.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Slicer gerçek gram ve süreyi hesaplar, biz bunun üstüne sabit formülü
        uygularız. Her siparişte kırılımı görürsün.
      </p>

      {/* Formula */}
      <section className="mt-12">
        <div className="flex items-center gap-2">
          <Calculator className="size-5 text-primary" />
          <h2 className="font-display text-2xl tracking-tight">
            Baskı Fiyat Formülü
          </h2>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardBody className="font-mono text-sm leading-relaxed">
              <div className="text-muted-foreground">
                materyal ={" "}
                <span className="text-foreground">gram × ₺/gram</span>
              </div>
              <div className="mt-1 text-muted-foreground">
                süre ={" "}
                <span className="text-foreground">
                  saat × ₺{settings.machineCostPerHourTRY}
                </span>
              </div>
              <div className="mt-1 text-muted-foreground">
                kurulum ={" "}
                <span className="text-foreground">
                  ₺{settings.setupFeeTRY}
                </span>
              </div>
              <div className="mt-3 border-t border-border pt-3 text-muted-foreground">
                ara = materyal + süre + kurulum
              </div>
              <div className="mt-1 text-foreground">
                <span className="text-primary">birim fiyat</span>{" "}
                = ara × (1 + %{settings.marginPercent})
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[color-mix(in_oklab,var(--color-brand)_18%,transparent)] text-primary">
                  <Truck className="size-5" />
                </span>
                <div>
                  <p className="font-semibold text-foreground">
                    Kargo ₺{settings.shippingFlatTRY}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Türkiye geneli sabit. ₺
                    {settings.freeShippingThresholdTRY} üzeri siparişlerde{" "}
                    <span className="text-[hsl(var(--success))]">
                      ücretsiz
                    </span>
                    .
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Example calc */}
      <section className="mt-14">
        <h2 className="font-display text-2xl tracking-tight">Örnek Hesap</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          35g PLA Siyah · 2 sa 36 dk baskı · Standart profil
        </p>
        <Card className="mt-5">
          <CardBody>
            {(() => {
              const grams = 35;
              const seconds = 2 * 3600 + 36 * 60;
              const pricePerGram = 2.5;
              const material = grams * pricePerGram;
              const time = (seconds / 3600) * settings.machineCostPerHourTRY;
              const sub = material + time + settings.setupFeeTRY;
              const unit = sub * (1 + settings.marginPercent / 100);
              return (
                <dl className="divide-y divide-border text-sm">
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-muted-foreground">
                      Materyal (35g × ₺{pricePerGram})
                    </dt>
                    <dd className="font-mono">₺{material.toFixed(2)}</dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-muted-foreground">
                      Süre (2.6 sa × ₺{settings.machineCostPerHourTRY})
                    </dt>
                    <dd className="font-mono">₺{time.toFixed(2)}</dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-muted-foreground">Kurulum</dt>
                    <dd className="font-mono">
                      ₺{settings.setupFeeTRY.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-muted-foreground/70">
                    <dt>Ara toplam</dt>
                    <dd className="font-mono">₺{sub.toFixed(2)}</dd>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-muted-foreground">
                      Kâr marjı (%{settings.marginPercent})
                    </dt>
                    <dd className="font-mono">
                      +₺{(unit - sub).toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <dt className="h-display text-base">Birim fiyat</dt>
                    <dd className="h-display text-2xl text-primary">
                      ₺{unit.toFixed(2)}
                    </dd>
                  </div>
                </dl>
              );
            })()}
          </CardBody>
        </Card>
      </section>

      {/* Materials */}
      <section className="mt-14">
        <div className="flex items-center gap-2">
          <Package className="size-5 text-primary" />
          <h2 className="font-display text-2xl tracking-tight">
            Materyal Fiyatları
          </h2>
        </div>
        {materials.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Henüz aktif materyal yok.
          </p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Materyal</th>
                  <th className="px-4 py-3 text-left">Tür</th>
                  <th className="px-4 py-3 text-left">Renk</th>
                  <th className="px-4 py-3 text-right">₺ / gram</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr
                    key={m.id}
                    className="border-t border-border bg-card"
                  >
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.type}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span
                          className="inline-block size-3.5 rounded-full border border-white/10"
                          style={{ background: m.colorHex }}
                        />
                        <span className="font-mono text-xs">
                          {m.colorHex.toUpperCase()}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      ₺{Number(m.pricePerGramTRY).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Credit packs */}
      <section className="mt-14">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2 className="font-display text-2xl tracking-tight">
            AI Kredi Paketleri
          </h2>
        </div>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Meshy AI ile metinden {settings.meshyTextCost} kredi, görselden{" "}
          {settings.meshyImageCost} kredi. Üretilen model direkt baskı pipeline&apos;ına
          girer.
        </p>
        {packs.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Şu an aktif paket yok.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-stagger>
            {packs.map((p) => {
              const perCredit = Number(p.priceTRY) / p.credits;
              return (
                <Card
                  key={p.id}
                  className="hover-lift flex flex-col hover:border-primary/40"
                >
                  <CardBody className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {p.name}
                      </p>
                      {p.badge && <Badge tone="accent">{p.badge}</Badge>}
                    </div>
                    <p className="mt-3 h-display text-4xl">
                      {p.credits}
                      <span className="ml-2 text-sm text-muted-foreground">
                        kredi
                      </span>
                    </p>
                    <p className="mt-4 text-3xl font-semibold">
                      ₺{Number(p.priceTRY).toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      kredi başına ₺{perCredit.toFixed(2)}
                    </p>
                    <div className="mt-auto pt-5">
                      <Link href="/account/credits">
                        <Button size="md" variant="outline" className="w-full">
                          Hesaptan Al
                          <ArrowRight className="size-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Closing CTA */}
      <section className="mt-14 rounded-xl border border-border bg-card p-10 text-center">
        <h3 className="h-display text-3xl">Dene, canlı fiyat gör.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Dosyanı yükle, 30 saniye içinde kesin fiyatı ekranda görürsün.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/upload">
            <Button size="lg">
              Dosyanı Yükle
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/designs">
            <Button size="lg" variant="secondary">
              Tasarımları Gör
            </Button>
          </Link>
        </div>
      </section>
    </Container>
  );
}
