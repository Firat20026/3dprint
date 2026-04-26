/**
 * POST /api/checkout
 *
 * Body: { items: CartItemPayload[], shipping: ShippingAddress }
 *
 * Atomic adımda: order draft oluştur → iyzico initialize → paymentPageUrl dön.
 * Client kullanıcıyı bu URL'e yönlendirir. Başarılı ödeme sonrası iyzico
 * callbackUrl'ine POST eder (bizim /api/payments/iyzico/callback).
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createOrderDraft } from "@/lib/orders";
import { initializePayment } from "@/lib/iyzico";
import { buildBuyer, extractClientIp, publicOrigin } from "@/lib/iyzico-helpers";
import { track, EVENTS } from "@/lib/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.items) || !body.shipping) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  let order;
  try {
    order = await createOrderDraft({
      userId: session.user.id,
      items: body.items,
      shipping: body.shipping,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "order create failed" },
      { status: 400 },
    );
  }

  void track(
    EVENTS.ORDER_CREATED,
    {
      orderId: order.id,
      itemCount: order.items.length,
      totalTRY: Number(order.totalTRY),
    },
    { userId: session.user.id },
  );

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      identityNumber: true,
      city: true,
      registrationAddress: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 401 });
  }

  // Use NEXTAUTH_URL as the canonical public origin — req.url reflects the
  // internal URL behind the reverse proxy (often http://localhost:3000), which
  // would make iyzico unable to call us back in production.
  const origin = publicOrigin(req);
  const callbackUrl = `${origin}/api/payments/iyzico/callback`;

  const buyer = buildBuyer({
    user,
    ip: extractClientIp(req),
    override: {
      fullName: body.shipping.fullName,
      phone: body.shipping.phone,
      identityNumber: body.shipping.identityNumber,
      address: body.shipping.address,
      city: body.shipping.city,
    },
  });

  const init = await initializePayment({
    orderId: order.id,
    conversationId: order.iyzicoConvId!,
    priceTRY: Number(order.totalTRY),
    paidPriceTRY: Number(order.totalTRY),
    buyer,
    shippingAddress: {
      contactName: body.shipping.fullName,
      city: body.shipping.city,
      country: "Türkiye",
      address: `${body.shipping.address}, ${body.shipping.district}`,
      zipCode: body.shipping.zipCode,
    },
    basketItems: order.items.map((it) => ({
      id: it.id,
      name:
        (it.snapshot as { title?: string } | null)?.title ??
        (it.sliceJobId ? "Özel Baskı" : "Tasarım"),
      category1: "3D Print",
      itemType: "PHYSICAL",
      price: Number(it.totalPriceTRY),
    })),
    callbackUrl,
  });

  if (!init.ok) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELED", notes: `iyzico init failed: ${init.error}` },
    });
    void track(EVENTS.PAYMENT_DENIED, {
      orderId: order.id,
      reason: "init-failed",
      error: init.error,
    });
    return NextResponse.json({ error: init.error }, { status: 502 });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { iyzicoToken: init.token },
  });

  void track(
    EVENTS.PAYMENT_INITIATED,
    {
      kind: "order",
      orderId: order.id,
      provider: "iyzico",
      totalTRY: Number(order.totalTRY),
    },
    { userId: session.user.id },
  );

  return NextResponse.json({
    orderId: order.id,
    paymentPageUrl: init.paymentPageUrl,
  });
}
