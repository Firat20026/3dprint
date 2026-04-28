/**
 * Designer earnings: how much each marketplace designer accrues per sale.
 *
 * Computation (per OrderItem, on PAID transition):
 *   amount = round( unitPriceTRY × quantity × markup / (markup + 100), 2 )
 *
 * Reasoning: the unitPriceTRY already has the markup baked in. The base
 * (pre-markup) component is `unit / (1 + markup/100)`, so the cut equals
 * `unit - base = unit × markup / (markup + 100)`.
 *
 * markupPercent is snapshotted at creation time so later admin tweaks of
 * `Design.basePriceMarkupPercent` don't rewrite historical earnings.
 *
 * The (orderItemId) unique constraint makes attributeOrderEarnings idempotent
 * — safe to re-run on duplicate iyzico callbacks.
 */
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

function computeDesignerCut(
  unitPriceTRY: Prisma.Decimal | number,
  quantity: number,
  markupPercent: number,
): Prisma.Decimal {
  if (markupPercent <= 0) return new Prisma.Decimal(0);
  const unit = new Prisma.Decimal(unitPriceTRY.toString());
  const total = unit.mul(quantity);
  // total × m / (m + 100)
  const cut = total.mul(markupPercent).div(markupPercent + 100);
  return cut.toDecimalPlaces(2);
}

/**
 * For each OrderItem with a marketplace design (uploader + markup > 0),
 * create a PENDING_PAYOUT DesignerEarning. Idempotent via unique(orderItemId).
 */
export async function attributeOrderEarnings(orderId: string): Promise<number> {
  const items = await prisma.orderItem.findMany({
    where: {
      orderId,
      designId: { not: null },
      design: {
        uploaderId: { not: null },
        basePriceMarkupPercent: { gt: 0 },
      },
    },
    include: {
      design: {
        select: {
          id: true,
          uploaderId: true,
          basePriceMarkupPercent: true,
        },
      },
    },
  });

  if (items.length === 0) return 0;

  let created = 0;
  for (const item of items) {
    if (!item.design || !item.design.uploaderId) continue;
    const markup = item.design.basePriceMarkupPercent ?? 0;
    if (markup <= 0) continue;

    const amount = computeDesignerCut(item.unitPriceTRY, item.quantity, markup);
    if (amount.lessThanOrEqualTo(0)) continue;

    // createMany with skipDuplicates would be cleaner but Postgres + Prisma
    // requires per-row catch on the unique violation; loop with upsert-like
    // semantics is just as cheap at our scale.
    try {
      await prisma.designerEarning.create({
        data: {
          designerId: item.design.uploaderId,
          designId: item.design.id,
          orderItemId: item.id,
          orderId,
          amountTRY: amount,
          markupPercent: markup,
        },
      });
      created++;
    } catch (err) {
      // P2002 = unique violation = already attributed (replay).
      const code = (err as { code?: string }).code;
      if (code !== "P2002") throw err;
    }
  }

  return created;
}

export type DesignerEarningSummary = {
  pendingTRY: number;
  paidOutTRY: number;
  totalTRY: number;
  pendingCount: number;
  paidOutCount: number;
};

export async function getDesignerSummary(
  designerId: string,
): Promise<DesignerEarningSummary> {
  const groups = await prisma.designerEarning.groupBy({
    by: ["status"],
    where: { designerId },
    _sum: { amountTRY: true },
    _count: { _all: true },
  });

  let pendingTRY = 0;
  let paidOutTRY = 0;
  let pendingCount = 0;
  let paidOutCount = 0;
  for (const g of groups) {
    const sum = g._sum.amountTRY ? Number(g._sum.amountTRY) : 0;
    if (g.status === "PENDING_PAYOUT") {
      pendingTRY = sum;
      pendingCount = g._count._all;
    } else if (g.status === "PAID_OUT") {
      paidOutTRY = sum;
      paidOutCount = g._count._all;
    }
  }

  return {
    pendingTRY,
    paidOutTRY,
    totalTRY: pendingTRY + paidOutTRY,
    pendingCount,
    paidOutCount,
  };
}

export async function listDesignerEarnings(
  designerId: string,
  limit = 100,
) {
  return prisma.designerEarning.findMany({
    where: { designerId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      design: { select: { id: true, slug: true, title: true } },
      order: { select: { id: true, status: true, createdAt: true } },
      orderItem: { select: { quantity: true, unitPriceTRY: true } },
    },
  });
}

/** Has this user ever uploaded a design? Used to gate the /account/earnings link. */
export async function userHasDesigns(userId: string): Promise<boolean> {
  const hit = await prisma.design.findFirst({
    where: { uploaderId: userId },
    select: { id: true },
  });
  return !!hit;
}
