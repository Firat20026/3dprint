import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

const REASONS: Record<string, string> = {
  "no-token": "Ödeme oturumu bulunamadı.",
  "order-not-found": "Sipariş bilgisi eşleşmedi.",
  "declined": "Ödeme onaylanmadı ya da reddedildi.",
};

export default async function CheckoutErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const msg = REASONS[reason ?? ""] ?? "Ödeme tamamlanamadı.";

  return (
    <Container className="py-20">
      <div className="mx-auto max-w-xl rounded-[var(--radius-card)] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-8 text-center">
        <p className="text-xs uppercase tracking-wider text-[var(--color-danger)]">
          Hata
        </p>
        <h1 className="mt-3 h-display text-3xl">
          Ödeme tamamlanamadı
        </h1>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">{msg}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/cart">
            <Button variant="secondary">Sepete Dön</Button>
          </Link>
          <Link href="/checkout">
            <Button>Tekrar Dene</Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
