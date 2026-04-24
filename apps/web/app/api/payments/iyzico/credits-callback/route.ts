/**
 * POST /api/payments/iyzico/credits-callback
 * GET  /api/payments/iyzico/credits-callback?mockToken=...
 *
 * CreditPurchase iyzico callback. Başarılı ödeme sonrası atomic transaction:
 *   - CreditPurchase.PAID + paidAt + iyzicoPaymentId
 *   - CreditLedger.insert (delta=+credits, reason=PURCHASE, refId=purchase.id)
 *   - User.credits += credits  (cache)
 *
 * Idempotent: PENDING_PAYMENT dışındaki statüler no-op.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { retrievePayment } from "@/lib/iyzico";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("mockToken") ?? url.searchParams.get("token");
  return handle(token, url.origin);
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const token = form?.get("token");
  const url = new URL(req.url);
  return handle(typeof token === "string" ? token : null, url.origin);
}

async function handle(token: string | null, origin: string) {
  if (!token) {
    return NextResponse.redirect(`${origin}/account/credits?error=no-token`);
  }

  const purchase = await prisma.creditPurchase.findUnique({
    where: { iyzicoToken: token },
  });
  if (!purchase) {
    return NextResponse.redirect(`${origin}/account/credits?error=not-found`);
  }

  // Idempotency — aynı token ikinci kez gelirse no-op.
  if (purchase.status !== "PENDING_PAYMENT") {
    return NextResponse.redirect(`${origin}/account/credits?purchased=1`);
  }

  const result = await retrievePayment(token);
  if (!result.ok || !result.paid) {
    await prisma.creditPurchase.update({
      where: { id: purchase.id },
      data: { status: "CANCELED" },
    });
    return NextResponse.redirect(`${origin}/account/credits?error=declined`);
  }

  // Atomic: purchase PAID + ledger entry + user balance bump
  await prisma.$transaction([
    prisma.creditPurchase.update({
      where: { id: purchase.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        iyzicoPaymentId: result.paymentId ?? undefined,
      },
    }),
    prisma.creditLedger.create({
      data: {
        userId: purchase.userId,
        delta: purchase.credits,
        reason: "PURCHASE",
        refId: purchase.id,
        note: `${purchase.credits} kredi satın alındı`,
      },
    }),
    prisma.user.update({
      where: { id: purchase.userId },
      data: { credits: { increment: purchase.credits } },
    }),
  ]);

  return NextResponse.redirect(`${origin}/account/credits?purchased=1`);
}
