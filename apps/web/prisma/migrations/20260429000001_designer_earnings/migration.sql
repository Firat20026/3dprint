-- DesignerEarning: per-OrderItem payout row created when an Order is paid
-- and the design has both an uploader and a non-zero markup. Idempotent via
-- unique(orderItemId).

CREATE TYPE "DesignerEarningStatus" AS ENUM ('PENDING_PAYOUT', 'PAID_OUT');

CREATE TABLE "DesignerEarning" (
    "id" TEXT NOT NULL,
    "designerId" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amountTRY" DECIMAL(10, 2) NOT NULL,
    "markupPercent" INTEGER NOT NULL,
    "status" "DesignerEarningStatus" NOT NULL DEFAULT 'PENDING_PAYOUT',
    "paidOutAt" TIMESTAMP(3),
    "paidOutNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignerEarning_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DesignerEarning_orderItemId_key" ON "DesignerEarning"("orderItemId");
CREATE INDEX "DesignerEarning_designerId_status_idx" ON "DesignerEarning"("designerId", "status");
CREATE INDEX "DesignerEarning_orderId_idx" ON "DesignerEarning"("orderId");

ALTER TABLE "DesignerEarning"
  ADD CONSTRAINT "DesignerEarning_designerId_fkey"
  FOREIGN KEY ("designerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DesignerEarning"
  ADD CONSTRAINT "DesignerEarning_designId_fkey"
  FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DesignerEarning"
  ADD CONSTRAINT "DesignerEarning_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DesignerEarning"
  ADD CONSTRAINT "DesignerEarning_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
