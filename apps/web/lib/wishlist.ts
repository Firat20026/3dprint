import { prisma } from "@/lib/db";

/** Returns a Set of wishlisted designIds for the user; empty when unauth. */
export async function getWishlistedDesignIds(
  userId: string | null | undefined,
): Promise<Set<string>> {
  if (!userId) return new Set();
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { designId: true },
  });
  return new Set(rows.map((r) => r.designId));
}

export async function listWishlistDesigns(userId: string) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      design: { include: { defaultProfile: true } },
    },
  });
}

export async function getWishlistCount(userId: string): Promise<number> {
  return prisma.wishlistItem.count({ where: { userId } });
}
