import { redirect } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PurchaseButton } from "@/components/credits/PurchaseButton";

export const dynamic = "force-dynamic";

const LEDGER_LABELS: Record<string, string> = {
  PURCHASE: "Satın alma",
  MESHY_TEXT: "AI üretim (metin)",
  MESHY_IMAGE: "AI üretim (görsel)",
  REFUND: "İade",
  ADMIN_GRANT: "Admin yükleme",
  ADMIN_REVOKE: "Admin iptal",
};

type SearchParams = Promise<{ purchased?: string; error?: string }>;

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?redirect=/account/credits");

  const sp = await searchParams;

  const [user, packs, ledger] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    }),
    prisma.creditPack.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.creditLedger.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const balance = user?.credits ?? 0;

  return (
    <Container className="py-12 animate-fade-in">
      <p className="eyebrow">Hesap</p>
      <div className="mt-3 flex items-center justify-between gap-6">
        <h1 className="h-display text-4xl md:text-5xl">
          Krediler
        </h1>
        <nav className="hidden gap-4 text-sm text-muted-foreground md:flex">
          <Link href="/account/orders" className="hover:text-foreground">
            Siparişler
          </Link>
          <Link href="/account/credits" className="text-foreground">
            Krediler
          </Link>
          <Link href="/account/my-designs" className="hover:text-foreground">
            Tasarımlar
          </Link>
        </nav>
      </div>

      {sp.purchased && (
        <div className="mt-8 rounded-xl border border-[color-mix(in_oklab,var(--color-success)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-success)_10%,transparent)] p-5 text-sm text-[hsl(var(--success))]">
          Kredileriniz hesabınıza yüklendi. Artık AI üretim için kullanabilirsiniz.
        </div>
      )}
      {sp.error && (
        <div className="mt-8 rounded-xl border border-[color-mix(in_oklab,var(--color-danger)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_10%,transparent)] p-5 text-sm text-destructive">
          Ödeme tamamlanamadı:{" "}
          {sp.error === "declined"
            ? "ödeme reddedildi."
            : sp.error === "not-found"
              ? "satın alma bulunamadı."
              : "beklenmeyen hata."}
        </div>
      )}

      {/* Balance hero */}
      <Card className="mt-10">
        <CardBody className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Bakiye
            </p>
            <p className="mt-2 font-display text-6xl uppercase tracking-tight">
              {balance}
              <span className="ml-3 align-middle text-lg text-muted-foreground">
                kredi
              </span>
            </p>
          </div>
          <Link
            href="/ai"
            className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-secondary px-5 py-3 text-sm text-foreground transition-colors hover:border-primary/40 sm:self-auto"
          >
            AI ile model üret →
          </Link>
        </CardBody>
      </Card>

      {/* Packs */}
      <h2 className="mt-14 font-display text-2xl uppercase tracking-tight">
        Kredi Paketleri
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-stagger>
        {packs.map((p) => {
          const perCredit = Number(p.priceTRY) / p.credits;
          return (
            <Card key={p.id} className="hover-lift flex flex-col hover:border-primary/40">
              <CardBody className="flex flex-1 flex-col">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{p.name}</p>
                  {p.badge && <Badge tone="accent">{p.badge}</Badge>}
                </div>
                <p className="mt-3 font-display text-4xl uppercase tracking-tight">
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
                <div className="mt-auto">
                  <PurchaseButton packId={p.id} />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Ledger */}
      <h2 className="mt-14 font-display text-2xl uppercase tracking-tight">
        Kredi Hareketleri
      </h2>
      {ledger.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Henüz hareket yok.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Tarih</th>
                <th className="px-5 py-3">İşlem</th>
                <th className="px-5 py-3">Not</th>
                <th className="px-5 py-3 text-right">Değişim</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(l.createdAt).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-5 py-3">
                    {LEDGER_LABELS[l.reason] ?? l.reason}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {l.note ?? "—"}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-mono ${
                      l.delta >= 0
                        ? "text-[hsl(var(--success))]"
                        : "text-destructive"
                    }`}
                  >
                    {l.delta >= 0 ? "+" : ""}
                    {l.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
