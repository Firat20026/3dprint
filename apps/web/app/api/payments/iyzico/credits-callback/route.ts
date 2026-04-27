/**
 * POST /api/payments/iyzico/credits-callback
 * GET  /api/payments/iyzico/credits-callback?mockToken=...
 *
 * CreditPurchase iyzico callback. Başarılı ödeme sonrası atomic transaction:
 *   - CreditPurchase.PAID + paidAt + iyzicoPaymentId  (koşullu update)
 *   - CreditLedger.insert (delta=+credits, reason=PURCHASE, refId=purchase.id)
 *   - User.credits += credits  (cache)
 *
 * Idempotency: koşullu updateMany; eş zamanlı 2 callback iki kez yazamaz.
 *
 * Redirect status: ALL responses use 303 See Other so that the browser
 * follows up with a GET (not a POST). NextResponse.redirect()'s default 307
 * preserves the HTTP method, which would re-POST to /account/credits — and
 * because that's a cross-site POST chain (iyzico → us → /account/credits),
 * sameSite=lax cookies (NextAuth session) wouldn't be sent and the user
 * would land on /login looking "logged out". 303 fixes this by forcing GET.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { retrievePayment } from "@/lib/iyzico";
import { publicOrigin } from "@/lib/iyzico-helpers";
import { track, logError, EVENTS } from "@/lib/observability";
import { notify, TEMPLATES } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 303 See Other: tells the browser to GET the next URL even if it arrived
// here via POST. Critical for preserving the user's session cookie when the
// callback was POSTed cross-site by iyzico.
function seeOther(url: string) {
  return NextResponse.redirect(url, 303);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("mockToken") ?? url.searchParams.get("token");
  return handle(token, publicOrigin(req));
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const token = form?.get("token");
  return handle(typeof token === "string" ? token : null, publicOrigin(req));
}

async function handle(token: string | null, origin: string) {
  void track(EVENTS.PAYMENT_CALLBACK_RECEIVED, {
    kind: "credits",
    hasToken: Boolean(token),
  });

  if (!token) {
    return seeOther(`${origin}/account/credits?error=no-token`);
  }

  const purchase = await prisma.creditPurchase.findUnique({
    where: { iyzicoToken: token },
  });
  if (!purchase) {
    void track(EVENTS.PAYMENT_DENIED, {
      kind: "credits",
      reason: "purchase-not-found",
    });
    return seeOther(`${origin}/account/credits?error=not-found`);
  }

  if (purchase.status !== "PENDING_PAYMENT") {
    void track(EVENTS.PAYMENT_DUPLICATE, {
      kind: "credits",
      purchaseId: purchase.id,
      currentStatus: purchase.status,
    });
    return seeOther(`${origin}/account/credits?purchased=1`);
  }

  const result = await retrievePayment(token);
  if (!result.ok || !result.paid) {
    await prisma.creditPurchase
      .updateMany({
        where: { id: purchase.id, status: "PENDING_PAYMENT" },
        data: { status: "CANCELED" },
      })
      .catch((e) =>
        logError(e, {
          source: "api:payments:credits-callback:cancel",
          severity: "MEDIUM",
          metadata: { purchaseId: purchase.id },
        }),
      );
    void track(EVENTS.PAYMENT_DENIED, {
      kind: "credits",
      purchaseId: purchase.id,
      reason: "error" in result ? result.error : "declined",
    });
    return seeOther(`${origin}/account/credits?error=declined`);
  }

  // Atomic block: flip CreditPurchase status conditionally; if we won the race
  // (count === 1), then create ledger entry + bump user balance. The ledger
  // create itself is protected by the unique (refId, reason) constraint, so a
  // second concurrent runner would also be rejected at that layer.
  let credited = false;
  try {
    credited = await prisma.$transaction(async (tx) => {
      const upd = await tx.creditPurchase.updateMany({
        where: { id: purchase.id, status: "PENDING_PAYMENT" },
        data: {
          status: "PAID",
          paidAt: new Date(),
          iyzicoPaymentId: result.paymentId ?? undefined,
        },
      });
      if (upd.count === 0) return false;

      await tx.creditLedger.create({
        data: {
          userId: purchase.userId,
          delta: purchase.credits,
          reason: "PURCHASE",
          refId: purchase.id,
          note: `${purchase.credits} kredi satın alındı`,
        },
      });
      await tx.user.update({
        where: { id: purchase.userId },
        data: { credits: { increment: purchase.credits } },
      });
      return true;
    });
  } catch (e) {
    await logError(e, {
      source: "api:payments:credits-callback:credit",
      severity: "HIGH",
      userId: purchase.userId,
      metadata: { purchaseId: purchase.id },
    });
    return seeOther(`${origin}/account/credits?error=internal`);
  }

  if (!credited) {
    void track(EVENTS.PAYMENT_DUPLICATE, {
      kind: "credits",
      purchaseId: purchase.id,
      reason: "race-lost",
    });
  } else {
    void track(
      EVENTS.CREDIT_PURCHASE_COMPLETED,
      {
        purchaseId: purchase.id,
        credits: purchase.credits,
        priceTRY: Number(purchase.priceTRY),
      },
      { userId: purchase.userId },
    );

    // Receipt email — best-effort, fire and forget.
    const buyer = await prisma.user.findUnique({
      where: { id: purchase.userId },
      select: { email: true },
    });
    if (buyer?.email) {
      void notify({
        to: buyer.email,
        template: TEMPLATES.CREDIT_PURCHASE_COMPLETED,
        data: {
          purchaseId: purchase.id,
          credits: purchase.credits,
          priceTRY: Number(purchase.priceTRY),
        },
      });
    }
  }

  return seeOther(`${origin}/account/credits?purchased=1`);
}
