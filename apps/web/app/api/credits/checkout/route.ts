/**
 * POST /api/credits/checkout
 *
 * Body: { packId: string }
 *
 * Kredi paketi satın alma akışı. CreditPurchase draft yaratır, iyzico
 * CheckoutForm initialize eder; callback `/api/payments/iyzico/credits-callback`
 * CreditLedger'a PURCHASE yazar + User.credits cache'i artırır.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initializePayment } from "@/lib/iyzico";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { packId?: string } | null;
  const packId = body?.packId;
  if (!packId) {
    return NextResponse.json({ error: "packId required" }, { status: 400 });
  }

  const pack = await prisma.creditPack.findUnique({ where: { id: packId } });
  if (!pack || !pack.isActive) {
    return NextResponse.json({ error: "pack not available" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 401 });
  }

  const conversationId = `conv_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const purchase = await prisma.creditPurchase.create({
    data: {
      userId: user.id,
      packId: pack.id,
      credits: pack.credits,
      priceTRY: pack.priceTRY,
      status: "PENDING_PAYMENT",
      iyzicoConvId: conversationId,
    },
  });

  const origin = new URL(req.url).origin;
  const callbackUrl = `${origin}/api/payments/iyzico/credits-callback`;

  const nameParts = (user.name ?? user.email).trim().split(/\s+/);
  const surname = nameParts.length > 1 ? (nameParts.pop() ?? "-") : "-";
  const name = nameParts.join(" ") || "Müşteri";

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "85.34.78.112";

  const init = await initializePayment({
    orderId: purchase.id,
    conversationId,
    priceTRY: Number(pack.priceTRY),
    paidPriceTRY: Number(pack.priceTRY),
    buyer: {
      id: user.id,
      name,
      surname,
      email: user.email,
      gsmNumber: "+905555555555",
      identityNumber: "11111111111",
      registrationAddress: "-",
      city: "İstanbul",
      country: "Türkiye",
      ip,
    },
    shippingAddress: {
      contactName: user.name ?? user.email,
      city: "İstanbul",
      country: "Türkiye",
      address: "-",
    },
    basketItems: [
      {
        id: pack.id,
        name: `${pack.name} (${pack.credits} kredi)`,
        category1: "Credits",
        itemType: "VIRTUAL",
        price: Number(pack.priceTRY),
      },
    ],
    callbackUrl,
  });

  if (!init.ok) {
    await prisma.creditPurchase.update({
      where: { id: purchase.id },
      data: { status: "CANCELED" },
    });
    return NextResponse.json({ error: init.error }, { status: 502 });
  }

  await prisma.creditPurchase.update({
    where: { id: purchase.id },
    data: { iyzicoToken: init.token },
  });

  return NextResponse.json({
    purchaseId: purchase.id,
    paymentPageUrl: init.paymentPageUrl,
  });
}
