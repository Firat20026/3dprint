import { Container } from "@/components/ui/container";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?redirect=/checkout");
  }

  return (
    <Container className="py-12 animate-fade-in">
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow">Ödeme</p>
        <h1 className="mt-3 h-display text-4xl md:text-5xl">
          Teslimat &amp; Ödeme
        </h1>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          Türkiye içi kargo 2-4 iş günü. Ödeme iyzico üzerinden güvenli.
        </p>
      </div>
      <CheckoutFlow
        user={{ email: session.user.email ?? "", name: session.user.name ?? "" }}
      />
    </Container>
  );
}
