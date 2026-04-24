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
        <nav className="hidden gap-4 text-sm text-[var(--color-text-muted)] md:flex">
          <Link href="/account/orders" className="hover:text-[var(--color-text)]">
            Siparişler
          </Link>
          <Link href="/account/credits" className="text-[var(--color-text)]">
            Krediler
          </Link>
          <Link href="/account/my-designs" className="hover:text-[var(--color-text)]">
            Tasarımlar
          </Link>
        </nav>
      </div>

      {sp.purchased && (
        <div className="mt-8 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--color-success)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-success)_10%,transparent)] p-5 text-sm text-[var(--color-success)]">
          Kredileriniz hesabınıza yüklendi. Artık AI üretim için kullanabilirsiniz.
        </div>
      )}
      {sp.error && (
        <div className="mt-8 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--color-danger)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_10%,transparent)] p-5 text-sm text-[var(--color-danger)]">
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
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              Bakiye
            </p>
            <p className="mt-2 font-display text-6xl uppercase tracking-tight">
              {balance}
              <span className="ml-3 align-middle text-lg text-[var(--color-text-muted)]">
                kredi
              </span>
            </p>
          </div>
          <Link
            href="/ai"
            className="inline-flex items-center gap-2 self-start rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-3 text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-brand)]/40 sm:self-auto"
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
            <Card key={p.id} className="hover-lift flex flex-col hover:border-[var(--color-brand)]/40">
              <CardBody className="flex flex-1 flex-col">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--color-text-muted)]">{p.name}</p>
                  {p.badge && <Badge tone="accent">{p.badge}</Badge>}
                </div>
                <p className="mt-3 font-display text-4xl uppercase tracking-tight">
                  {p.credits}
                  <span className="ml-2 text-sm text-[var(--color-text-muted)]">
                    kredi
                  </span>
                </p>
                <p className="mt-4 text-3xl font-semibold">
                  ₺{Number(p.priceTRY).toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
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
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center text-sm text-[var(--color-text-muted)]">
          Henüz hareket yok.
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
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
                  className="border-b border-[var(--color-border)]/60 last:border-0"
                >
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">
                    {new Date(l.createdAt).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-5 py-3">
                    {LEDGER_LABELS[l.reason] ?? l.reason}
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-muted)]">
                    {l.note ?? "—"}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-mono ${
                      l.delta >= 0
                        ? "text-[var(--color-success)]"
                        : "text-[var(--color-danger)]"
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
