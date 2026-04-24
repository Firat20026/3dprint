/**
 * POST /api/payments/iyzico/callback
 * GET  /api/payments/iyzico/callback?mockToken=...
 *
 * iyzico başarılı ödeme sonunda bu URL'e POST eder (form params: token).
 * Biz retrievePayment ile sonucu doğrular, Order'ı PAID → IN_QUEUE'a çekeriz.
 *
 * Mock mode'da initializePayment direkt bu URL'e redirect eder (?mockToken=).
 *
 * Idempotent: aynı token ikinci kez gelirse no-op (status = PAID zaten).
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
    return NextResponse.redirect(`${origin}/checkout/error?reason=no-token`);
  }

  const order = await prisma.order.findUnique({ where: { iyzicoToken: token } });
  if (!order) {
    return NextResponse.redirect(`${origin}/checkout/error?reason=order-not-found`);
  }

  // Idempotency — PENDING_PAYMENT dışında herhangi bir state "already handled".
  // Callback ikinci kez gelirse (browser back, retry), order durumunu resetlemeyiz.
  if (order.status !== "PENDING_PAYMENT") {
    return NextResponse.redirect(`${origin}/account/orders/${order.id}?paid=1`);
  }

  const result = await retrievePayment(token);
  if (!result.ok || !result.paid) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELED",
        notes: `payment not confirmed: ${"error" in result ? result.error : "declined"}`,
      },
    });
    return NextResponse.redirect(`${origin}/checkout/error?reason=declined`);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: "IN_QUEUE",
      paidAt: new Date(),
      iyzicoPaymentId: result.paymentId ?? undefined,
    },
  });

  return NextResponse.redirect(`${origin}/account/orders/${order.id}?paid=1`);
}
