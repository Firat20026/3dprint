/**
 * POST /api/credits/checkout
 *
 * Body: { packId: string }
 *
 * Kredi paketi satın alma akışı. CreditPurchase draft yaratır, iyzico
 * CheckoutForm initialize eder; callback `/api/payments/iyzico/credits-callback`
 * CreditLedger'a PURCHASE yazar + User.credits cache'i artırır.
 *
 * Buyer bilgisi: User profilinden alınır (name, email zorunlu; phone, TCKN
 * opsiyonel — yoksa sandbox dummy değerleri gönderilir, kullanıcıya profilini
 * tamamlama uyarısı UI tarafında verilir).
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initializePayment } from "@/lib/iyzico";
import { buildBuyer, extractClientIp, publicOrigin } from "@/lib/iyzico-helpers";
import { track, logError, EVENTS } from "@/lib/observability";

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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      identityNumber: true,
      city: true,
      registrationAddress: true,
    },
  });
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

  void track(
    EVENTS.CREDIT_PURCHASE_INITIATED,
    {
      purchaseId: purchase.id,
      packId: pack.id,
      credits: pack.credits,
      priceTRY: Number(pack.priceTRY),
    },
    { userId: user.id },
  );

  // Use NEXTAUTH_URL as the canonical public origin — see /api/checkout for why.
  const origin = publicOrigin(req);
  const callbackUrl = `${origin}/api/payments/iyzico/credits-callback`;

  const buyer = buildBuyer({
    user,
    ip: extractClientIp(req),
  });

  let init: Awaited<ReturnType<typeof initializePayment>>;
  try {
    init = await initializePayment({
      orderId: purchase.id,
      conversationId,
      priceTRY: Number(pack.priceTRY),
      paidPriceTRY: Number(pack.priceTRY),
      buyer,
      shippingAddress: {
        // Virtual purchase but iyzico still wants a shippingAddress object.
        // Reuse buyer's known city/address so the data shown in iyzico merchant
        // panel matches the actual customer.
        contactName: `${buyer.name} ${buyer.surname}`.trim(),
        city: buyer.city,
        country: buyer.country,
        address: buyer.registrationAddress,
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
  } catch (e) {
    await logError(e, {
      source: "api:credits-checkout:iyzico-init",
      severity: "HIGH",
      userId: user.id,
      metadata: { purchaseId: purchase.id, packId: pack.id },
    });
    await prisma.creditPurchase.update({
      where: { id: purchase.id },
      data: { status: "CANCELED" },
    });
    return NextResponse.json(
      { error: "Ödeme servisi başlatılamadı. Lütfen tekrar deneyin." },
      { status: 502 },
    );
  }

  if (!init.ok) {
    await prisma.creditPurchase.update({
      where: { id: purchase.id },
      data: { status: "CANCELED" },
    });
    void logError(new Error(`iyzico init: ${init.error}`), {
      source: "api:credits-checkout:iyzico-init-failed",
      severity: "HIGH",
      userId: user.id,
      metadata: { purchaseId: purchase.id, iyzicoError: init.error },
    });
    return NextResponse.json({ error: init.error }, { status: 502 });
  }

  await prisma.creditPurchase.update({
    where: { id: purchase.id },
    data: { iyzicoToken: init.token },
  });

  void track(
    EVENTS.PAYMENT_INITIATED,
    {
      kind: "credits",
      purchaseId: purchase.id,
      provider: "iyzico",
    },
    { userId: user.id },
  );

  return NextResponse.json({
    purchaseId: purchase.id,
    paymentPageUrl: init.paymentPageUrl,
  });
}
