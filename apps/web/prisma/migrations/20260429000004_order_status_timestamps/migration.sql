-- Per-status timestamps so the order timeline can render real dates,
-- not just createdAt/paidAt/shippedAt.

ALTER TABLE "Order" ADD COLUMN "printingStartedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "canceledAt" TIMESTAMP(3);
