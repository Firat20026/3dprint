"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logError, track } from "@/lib/observability";

type ToggleResult =
  | { ok: true; wishlisted: boolean }
  | { ok: false; error: string; needsLogin?: boolean };

/**
 * Idempotent toggle: if (user, design) row exists → delete; otherwise create.
 * Returns the resulting state so the client can update its UI without a
 * full router refresh.
 */
export async function toggleWishlist(designId: string): Promise<ToggleResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Giriş yapman gerekiyor.", needsLogin: true };
    }
    if (!designId) return { ok: false, error: "Tasarım bulunamadı." };

    const userId = session.user.id;
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_designId: { userId, designId } },
      select: { id: true },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      void track(
        "WISHLIST_REMOVED",
        { designId },
        { userId, level: "DEBUG" },
      );
      revalidatePath("/account/wishlist");
      return { ok: true, wishlisted: false };
    }

    const design = await prisma.design.findUnique({
      where: { id: designId },
      select: { id: true, status: true },
    });
    if (!design || design.status !== "PUBLISHED") {
      return { ok: false, error: "Tasarım yayında değil." };
    }

    await prisma.wishlistItem.create({ data: { userId, designId } });
    void track(
      "WISHLIST_ADDED",
      { designId },
      { userId, level: "DEBUG" },
    );
    revalidatePath("/account/wishlist");
    return { ok: true, wishlisted: true };
  } catch (err) {
    void logError(err, { source: "action:toggle-wishlist", severity: "LOW" });
    return { ok: false, error: "İşlem başarısız." };
  }
}
