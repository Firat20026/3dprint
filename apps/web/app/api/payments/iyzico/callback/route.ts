/**
 * POST /api/payments/iyzico/callback
 * GET  /api/payments/iyzico/callback?mockToken=...
 *
 * iyzico başarılı ödeme sonunda bu URL'e POST eder (form params: token).
 * Biz retrievePayment ile sonucu doğrular, Order'ı PENDING_PAYMENT → IN_QUEUE'a çekeriz.
 *
 * Mock mode'da initializePayment direkt bu URL'e redirect eder (?mockToken=).
 *
 * Idempotency: prisma.order.updateMany({ where: { id, status: PENDING_PAYMENT } })
 * ile koşullu update — eş zamanlı 2 callback iki kez PAID yapamaz.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { retrievePayment } from "@/lib/iyzico";
import { publicOrigin } from "@/lib/iyzico-helpers";
import { track, logError, EVENTS } from "@/lib/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    kind: "order",
    hasToken: Boolean(token),
  });

  if (!token) {
    return NextResponse.redirect(`${origin}/checkout/error?reason=no-token`);
  }

  const order = await prisma.order.findUnique({ where: { iyzicoToken: token } });
  if (!order) {
    void track(EVENTS.PAYMENT_DENIED, { reason: "order-not-found" });
    return NextResponse.redirect(`${origin}/checkout/error?reason=order-not-found`);
  }

  // Already-handled: silent success redirect
  if (order.status !== "PENDING_PAYMENT") {
    void track(EVENTS.PAYMENT_DUPLICATE, {
      orderId: order.id,
      currentStatus: order.status,
    });
    return NextResponse.redirect(`${origin}/account/orders/${order.id}?paid=1`);
  }

  const result = await retrievePayment(token);
  if (!result.ok || !result.paid) {
    // Cancel atomically only if still pending — avoids racing with concurrent callbacks
    await prisma.order
      .updateMany({
        where: { id: order.id, status: "PENDING_PAYMENT" },
        data: {
          status: "CANCELED",
          notes: `payment not confirmed: ${"error" in result ? result.error : "declined"}`,
        },
      })
      .catch((e) =>
        logError(e, {
          source: "api:payments:order-callback:cancel",
          severity: "MEDIUM",
          metadata: { orderId: order.id },
        }),
      );
    void track(EVENTS.PAYMENT_DENIED, {
      orderId: order.id,
      reason: "error" in result ? result.error : "declined",
    });
    return NextResponse.redirect(`${origin}/checkout/error?reason=declined`);
  }

  // Atomic conditional: only flip if still PENDING_PAYMENT. result.count tells us
  // whether we won the race. 0 means another callback got there first.
  const updated = await prisma.order.updateMany({
    where: { id: order.id, status: "PENDING_PAYMENT" },
    data: {
      status: "IN_QUEUE",
      paidAt: new Date(),
      iyzicoPaymentId: result.paymentId ?? undefined,
    },
  });

  if (updated.count === 0) {
    void track(EVENTS.PAYMENT_DUPLICATE, {
      orderId: order.id,
      reason: "race-lost",
    });
  } else {
    void track(
      EVENTS.PAYMENT_VERIFIED,
      {
        orderId: order.id,
        amountTRY: Number(order.totalTRY),
        paymentId: result.paymentId,
      },
      { userId: order.userId },
    );
  }

  return NextResponse.redirect(`${origin}/account/orders/${order.id}?paid=1`);
}
