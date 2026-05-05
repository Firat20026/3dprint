/**
 * Shared coupon utilities used by both the validate API and checkout flow.
 */
import type { Coupon } from "@prisma/client";

/**
 * Compute the ₺ discount amount for a given coupon and subtotal.
 * Result is clamped to [0, subtotalTRY] so it never produces a negative order.
 */
export function computeDiscount(
  coupon: Pick<Coupon, "discountType" | "discountValue">,
  subtotalTRY: number,
): number {
  const value = Number(coupon.discountValue);
  const raw =
    coupon.discountType === "PERCENT"
      ? (subtotalTRY * value) / 100
      : value;
  return Math.min(Math.max(raw, 0), subtotalTRY);
}

/**
 * Round a monetary value to 2 decimal places (banker's rounding via toFixed).
 */
export function roundTRY(n: number): number {
  return Math.round(n * 100) / 100;
}
