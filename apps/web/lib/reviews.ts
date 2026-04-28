import { prisma } from "@/lib/db";
import type { DesignReview } from "@prisma/client";

export type DesignReviewWithUser = DesignReview & {
  user: { id: string; name: string | null; image: string | null };
};

export type DesignRatingSummary = {
  count: number;        // approved review count
  average: number;      // 0..5, two-decimal precision
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

const EMPTY_DISTRIBUTION: DesignRatingSummary["distribution"] = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

/** Aggregate APPROVED reviews for a single design. */
export async function getDesignRatingSummary(
  designId: string,
): Promise<DesignRatingSummary> {
  const groups = await prisma.designReview.groupBy({
    by: ["rating"],
    where: { designId, status: "APPROVED" },
    _count: { _all: true },
  });

  const distribution = { ...EMPTY_DISTRIBUTION };
  let total = 0;
  let weighted = 0;
  for (const g of groups) {
    const r = g.rating as 1 | 2 | 3 | 4 | 5;
    if (r >= 1 && r <= 5) {
      distribution[r] = g._count._all;
      total += g._count._all;
      weighted += r * g._count._all;
    }
  }

  return {
    count: total,
    average: total > 0 ? Math.round((weighted / total) * 100) / 100 : 0,
    distribution,
  };
}

/**
 * Batched lookup so the catalog grid can show stars without N+1 queries.
 * Returns a Map keyed by designId.
 */
export async function getDesignRatingSummaries(
  designIds: string[],
): Promise<Map<string, DesignRatingSummary>> {
  const result = new Map<string, DesignRatingSummary>();
  if (designIds.length === 0) return result;

  const groups = await prisma.designReview.groupBy({
    by: ["designId", "rating"],
    where: { designId: { in: designIds }, status: "APPROVED" },
    _count: { _all: true },
  });

  for (const id of designIds) {
    result.set(id, { count: 0, average: 0, distribution: { ...EMPTY_DISTRIBUTION } });
  }

  const totals = new Map<string, { count: number; weighted: number }>();
  for (const g of groups) {
    const r = g.rating as 1 | 2 | 3 | 4 | 5;
    if (r < 1 || r > 5) continue;
    const summary = result.get(g.designId)!;
    summary.distribution[r] = g._count._all;
    const t = totals.get(g.designId) ?? { count: 0, weighted: 0 };
    t.count += g._count._all;
    t.weighted += r * g._count._all;
    totals.set(g.designId, t);
  }

  for (const [id, t] of totals) {
    const s = result.get(id)!;
    s.count = t.count;
    s.average = t.count > 0 ? Math.round((t.weighted / t.count) * 100) / 100 : 0;
  }

  return result;
}

/** List APPROVED reviews for a design, newest first. */
export async function listDesignReviews(
  designId: string,
  limit = 20,
): Promise<DesignReviewWithUser[]> {
  return prisma.designReview.findMany({
    where: { designId, status: "APPROVED" },
    orderBy: [{ verifiedBuyer: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });
}

/**
 * Verified-buyer check: did this user actually receive (or at least pay for)
 * a copy of this design? We accept any post-payment status — refunded /
 * canceled orders don't count.
 */
export async function userIsVerifiedBuyer(
  userId: string,
  designId: string,
): Promise<boolean> {
  const hit = await prisma.orderItem.findFirst({
    where: {
      designId,
      order: {
        userId,
        status: { in: ["PAID", "IN_QUEUE", "PRINTING", "SHIPPED", "DELIVERED"] },
      },
    },
    select: { id: true },
  });
  return !!hit;
}

export async function getUserReviewForDesign(
  userId: string,
  designId: string,
): Promise<DesignReview | null> {
  return prisma.designReview.findUnique({
    where: { designId_userId: { designId, userId } },
  });
}
