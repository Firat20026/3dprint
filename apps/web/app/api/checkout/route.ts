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

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 401 });
  }

  const origin = new URL(req.url).origin;
  const callbackUrl = `${origin}/api/payments/iyzico/callback`;

  const nameParts = (body.shipping.fullName as string).trim().split(/\s+/);
  const surname = nameParts.pop() ?? "-";
  const name = nameParts.join(" ") || body.shipping.fullName || "Müşteri";

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "85.34.78.112";

  const init = await initializePayment({
    orderId: order.id,
    conversationId: order.iyzicoConvId!,
    priceTRY: Number(order.totalTRY),
    paidPriceTRY: Number(order.totalTRY),
    buyer: {
      id: user.id,
      name,
      surname,
      email: user.email,
      gsmNumber: sanitizeGsm(body.shipping.phone),
      identityNumber: body.shipping.identityNumber || "11111111111",
      registrationAddress: body.shipping.address,
      city: body.shipping.city,
      country: "Türkiye",
      ip,
    },
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
    return NextResponse.json({ error: init.error }, { status: 502 });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { iyzicoToken: init.token },
  });

  return NextResponse.json({
    orderId: order.id,
    paymentPageUrl: init.paymentPageUrl,
  });
}

function sanitizeGsm(phone: string): string {
  // iyzico +905xxxxxxxxx formatında ister. "0555..." veya "5 55 ..." gibi input'ları normalize et.
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+9${digits}`;
  if (digits.startsWith("5")) return `+90${digits}`;
  return `+${digits}`;
}
