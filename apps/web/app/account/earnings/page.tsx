import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { auth } from "@/lib/auth";
import {
  getDesignerSummary,
  listDesignerEarnings,
  userHasDesigns,
} from "@/lib/earnings";
import { TrendingUp, Wallet, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

const TRY = (n: number) =>
  n.toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  });

export default async function EarningsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?redirect=/account/earnings");
  const userId = session.user.id;

  const hasDesigns = await userHasDesigns(userId);

  const [summary, rows] = await Promise.all([
    getDesignerSummary(userId),
    listDesignerEarnings(userId, 100),
  ]);

  return (
    <Container className="py-12 animate-fade-in">
      <p className="eyebrow">Hesap</p>
      <h1 className="mt-3 h-display text-4xl md:text-5xl">Kazançlarım</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Yüklediğin tasarımlardan elde ettiğin gelirler. Ödeme talimatın için{" "}
        <Link
          href="/account/settings"
          className="font-medium text-foreground hover:underline"
        >
          profilini güncelle
        </Link>{" "}
        — admin manuel olarak transfer eder ve durumu &quot;Ödendi&quot;ye çeker.
      </p>

      {!hasDesigns ? (
        <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-display text-xl uppercase tracking-tight">
            Henüz tasarım yüklemedin
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Tasarım yükle, biri satın aldığında payın otomatik biriksin.
          </p>
          <Link
            href="/account/my-designs"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
          >
            Tasarımlarıma Git →
          </Link>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <SummaryCard
              icon={<Wallet className="size-5" />}
              label="Bekleyen Ödeme"
              value={TRY(summary.pendingTRY)}
              hint={`${summary.pendingCount} satış`}
              tone="brand"
            />
            <SummaryCard
              icon={<CheckCircle2 className="size-5" />}
              label="Ödenen"
              value={TRY(summary.paidOutTRY)}
              hint={`${summary.paidOutCount} ödeme`}
              tone="muted"
            />
            <SummaryCard
              icon={<TrendingUp className="size-5" />}
              label="Toplam Kazanç"
              value={TRY(summary.totalTRY)}
              hint="Tüm zamanlar"
              tone="accent"
            />
          </div>

          {/* Earnings list */}
          <div className="mt-10">
            <h2 className="mb-4 font-display text-xl uppercase tracking-tight">
              Son Satışlar
            </h2>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henüz satış yok. Tasarımın yayınlandığında ve sipariş alındığında
                burada görünecek.
              </p>
            ) : (
              <div className="overflow-hidden overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Tasarım</th>
                      <th className="px-4 py-3 text-right">Adet</th>
                      <th className="px-4 py-3 text-right">Birim</th>
                      <th className="px-4 py-3 text-right">Markup</th>
                      <th className="px-4 py-3 text-right">Kazanç</th>
                      <th className="px-4 py-3 text-left">Durum</th>
                      <th className="px-4 py-3 text-left">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.id}
                        className="border-t border-border bg-card"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/designs/${r.design.slug}`}
                            className="hover:text-foreground"
                            target="_blank"
                          >
                            {r.design.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {r.orderItem.quantity}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {TRY(Number(r.orderItem.unitPriceTRY))}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          %{r.markupPercent}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-medium">
                          {TRY(Number(r.amountTRY))}
                        </td>
                        <td className="px-4 py-3">
                          {r.status === "PAID_OUT" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                              <CheckCircle2 className="size-3" />
                              Ödendi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-warning,#f5b740)]/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-warning,#f5b740)]">
                              Beklemede
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {r.createdAt.toLocaleDateString("tr-TR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Container>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone: "brand" | "muted" | "accent";
}) {
  const ring =
    tone === "brand"
      ? "border-primary/30 bg-primary/5"
      : tone === "accent"
        ? "border-foreground/30 bg-foreground/5"
        : "border-border bg-card";
  return (
    <div className={`rounded-xl border p-5 ${ring}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl text-foreground">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {hint}
        </p>
      )}
    </div>
  );
}
