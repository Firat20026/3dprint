-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- AlterTable: add coupon columns to Order
ALTER TABLE "Order"
  ADD COLUMN "discountTRY" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "couponCode"  TEXT;

-- CreateTable: Coupon
CREATE TABLE "Coupon" (
  "id"              TEXT         NOT NULL,
  "code"            TEXT         NOT NULL,
  "description"     TEXT,
  "discountType"    "DiscountType" NOT NULL,
  "discountValue"   DECIMAL(10,2) NOT NULL,
  "minOrderTRY"     DECIMAL(10,2),
  "maxUsageTotal"   INTEGER,
  "maxUsagePerUser" INTEGER      NOT NULL DEFAULT 1,
  "usageCount"      INTEGER      NOT NULL DEFAULT 0,
  "isActive"        BOOLEAN      NOT NULL DEFAULT true,
  "expiresAt"       TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CouponUse
CREATE TABLE "CouponUse" (
  "id"        TEXT         NOT NULL,
  "couponId"  TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "orderId"   TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CouponUse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key"        ON "Coupon"("code");
CREATE INDEX "Coupon_code_idx"               ON "Coupon"("code");
CREATE INDEX "Coupon_isActive_expiresAt_idx" ON "Coupon"("isActive", "expiresAt");

CREATE UNIQUE INDEX "CouponUse_orderId_key"       ON "CouponUse"("orderId");
CREATE INDEX "CouponUse_couponId_idx"             ON "CouponUse"("couponId");
CREATE INDEX "CouponUse_userId_couponId_idx"      ON "CouponUse"("userId", "couponId");

-- AddForeignKey
ALTER TABLE "CouponUse"
  ADD CONSTRAINT "CouponUse_couponId_fkey"
    FOREIGN KEY ("couponId") REFERENCES "Coupon"("id")   ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CouponUse"
  ADD CONSTRAINT "CouponUse_orderId_fkey"
    FOREIGN KEY ("orderId")  REFERENCES "Order"("id")    ON DELETE CASCADE  ON UPDATE CASCADE;
