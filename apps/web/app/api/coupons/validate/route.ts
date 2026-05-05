/**
 * POST /api/coupons/validate
 *
 * Validates a coupon code against a cart subtotal and the current user.
 * Called client-side from the checkout form before the user submits.
 *
 * Body: { code: string; subtotalTRY: number }
 * Response: { valid: boolean; discountTRY?: number; message?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeDiscount } from "@/lib/coupons";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ valid: false, message: "Giriş yapman gerekiyor." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const code: string = (body?.code ?? "").trim().toUpperCase();
  const subtotalTRY: number = Number(body?.subtotalTRY ?? 0);

  if (!code) {
    return NextResponse.json({ valid: false, message: "Kupon kodu boş olamaz." });
  }

  const coupon = await prisma.coupon.findUnique({ where: { code } });

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ valid: false, message: "Geçersiz kupon kodu." });
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, message: "Bu kupanın süresi dolmuş." });
  }

  if (coupon.maxUsageTotal !== null && coupon.usageCount >= coupon.maxUsageTotal) {
    return NextResponse.json({ valid: false, message: "Bu kupon kullanım limitine ulaştı." });
  }

  if (coupon.minOrderTRY !== null && subtotalTRY < Number(coupon.minOrderTRY)) {
    return NextResponse.json({
      valid: false,
      message: `Bu kupon için minimum sipariş tutarı ₺${Number(coupon.minOrderTRY).toFixed(2)}.`,
    });
  }

  // Check per-user usage limit
  const useCount = await prisma.couponUse.count({
    where: { couponId: coupon.id, userId: session.user.id },
  });
  if (useCount >= coupon.maxUsagePerUser) {
    return NextResponse.json({ valid: false, message: "Bu kuponu daha önce kullandın." });
  }

  const discountTRY = computeDiscount(coupon, subtotalTRY);

  return NextResponse.json({
    valid: true,
    couponId: coupon.id,
    discountTRY,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    message:
      coupon.discountType === "PERCENT"
        ? `%${Number(coupon.discountValue)} indirim uygulandı`
        : `₺${discountTRY.toFixed(2)} indirim uygulandı`,
  });
}
