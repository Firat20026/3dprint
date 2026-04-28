import { prisma } from "@/lib/db";

export type DesignerPublicProfile = {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  websiteUrl: string | null;
  joinedAt: Date;
  publishedDesignCount: number;
  totalReviews: number;
  averageRating: number; // 0..5
};

/**
 * Public profile lookup: returns null when the user doesn't exist or has
 * never published a design (we don't expose account pages for non-designers).
 */
export async function getDesignerPublicProfile(
  userId: string,
): Promise<DesignerPublicProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      websiteUrl: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const [publishedCount, ratingAgg] = await Promise.all([
    prisma.design.count({
      where: { uploaderId: userId, status: "PUBLISHED" },
    }),
    prisma.designReview.aggregate({
      where: {
        status: "APPROVED",
        design: { uploaderId: userId, status: "PUBLISHED" },
      },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  if (publishedCount === 0) return null;

  return {
    id: user.id,
    name: user.name,
    image: user.image,
    bio: user.bio,
    websiteUrl: user.websiteUrl,
    joinedAt: user.createdAt,
    publishedDesignCount: publishedCount,
    totalReviews: ratingAgg._count._all,
    averageRating: ratingAgg._avg.rating
      ? Math.round((ratingAgg._avg.rating ?? 0) * 100) / 100
      : 0,
  };
}

export async function listDesignerPublishedDesigns(userId: string) {
  return prisma.design.findMany({
    where: { uploaderId: userId, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: { defaultProfile: true },
  });
}
