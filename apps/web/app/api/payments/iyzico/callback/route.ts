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
 *
 * Redirect status: ALL responses use 303 See Other so the browser follows
 * with a GET (not a POST). NextResponse.redirect()'s default 307 preserves
 * the HTTP method, which would re-POST to /account/orders — that's a
 * cross-site POST chain (iyzico → us → /account/orders), and sameSite=lax
 * cookies (NextAuth session) wouldn't be sent, sending the user to /login
 * looking "logged out". 303 forces GET and the cookie travels with it.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { retrievePayment } from "@/lib/iyzico";
import { publicOrigin } from "@/lib/iyzico-helpers";
import { track, logError, EVENTS } from "@/lib/observability";
import { notify, TEMPLATES } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    kind: "order",
    hasToken: Boolean(token),
  });

  if (!token) {
    return seeOther(`${origin}/checkout/error?reason=no-token`);
  }

  const order = await prisma.order.findUnique({ where: { iyzicoToken: token } });
  if (!order) {
    void track(EVENTS.PAYMENT_DENIED, { reason: "order-not-found" });
    return seeOther(`${origin}/checkout/error?reason=order-not-found`);
  }

  // Already-handled: silent success redirect
  if (order.status !== "PENDING_PAYMENT") {
    void track(EVENTS.PAYMENT_DUPLICATE, {
      orderId: order.id,
      currentStatus: order.status,
    });
    return seeOther(`${origin}/account/orders/${order.id}?paid=1`);
  }

  const result = await retrievePayment(token);
  if (!result.ok || !result.paid) {
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
    return seeOther(`${origin}/checkout/error?reason=declined`);
  }

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

    // Order confirmation email — best-effort.
    const detail = await prisma.order.findUnique({
      where: { id: order.id },
      select: {
        user: { select: { email: true } },
        items: {
          select: {
            quantity: true,
            snapshot: true,
            sliceJobId: true,
            designId: true,
          },
        },
      },
    });
    if (detail?.user.email) {
      void notify({
        to: detail.user.email,
        template: TEMPLATES.ORDER_CONFIRMED,
        data: {
          orderId: order.id,
          totalTRY: Number(order.totalTRY),
          items: detail.items.map((it) => ({
            title:
              (it.snapshot as { title?: string } | null)?.title ??
              (it.sliceJobId ? "Özel Baskı" : "Tasarım"),
            quantity: it.quantity,
          })),
        },
      });
    }
  }

  return seeOther(`${origin}/account/orders/${order.id}?paid=1`);
}
