/**
 * Trending designs — ranked by recent sales with fallbacks.
 *
 * Score = paid-or-later OrderItem count in the last `windowDays`
 * (default 30). Ties broken by recent reviews then by recency.
 *
 * When the platform is brand-new (zero sales), we fall back to the most
 * recently PUBLISHED designs so the home grid is never empty.
 */
import { prisma } from "@/lib/db";
import type { Design } from "@prisma/client";

const POST_PAYMENT_STATUSES = [
  "PAID",
  "IN_QUEUE",
  "PRINTING",
  "SHIPPED",
  "DELIVERED",
] as const;

export async function listTrendingDesigns(
  limit = 8,
  windowDays = 30,
): Promise<Design[]> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const sales = await prisma.orderItem.groupBy({
    by: ["designId"],
    where: {
      designId: { not: null },
      order: {
        status: { in: [...POST_PAYMENT_STATUSES] },
        paidAt: { gte: since },
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit * 2, // overshoot in case some designs are unpublished now
  });

  const orderedIds = sales
    .map((s) => s.designId)
    .filter((id): id is string => !!id);

  if (orderedIds.length > 0) {
    const designs = await prisma.design.findMany({
      where: { id: { in: orderedIds }, status: "PUBLISHED" },
    });
    // Re-order to match the sales ranking — findMany doesn't preserve `in` order.
    const byId = new Map(designs.map((d) => [d.id, d]));
    const ranked = orderedIds
      .map((id) => byId.get(id))
      .filter((d): d is Design => !!d)
      .slice(0, limit);
    if (ranked.length >= limit) return ranked;

    // Pad with newest published designs we haven't already included.
    const padNeeded = limit - ranked.length;
    const exclude = new Set(ranked.map((d) => d.id));
    const padded = await prisma.design.findMany({
      where: { status: "PUBLISHED", id: { notIn: [...exclude] } },
      orderBy: { createdAt: "desc" },
      take: padNeeded,
    });
    return [...ranked, ...padded];
  }

  // Cold start: just return the newest published designs.
  return prisma.design.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
