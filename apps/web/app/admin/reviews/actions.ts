"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { track, EVENTS, logError } from "@/lib/observability";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function hideReview(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const id = String(formData.get("reviewId") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim() || null;
    if (!id) return { ok: false, error: "Yorum bulunamadı." };

    const review = await prisma.designReview.update({
      where: { id },
      data: { status: "HIDDEN", hiddenReason: reason },
      select: { designId: true, design: { select: { slug: true } } },
    });

    revalidatePath("/admin/reviews");
    revalidatePath(`/designs/${review.design.slug}`);
    revalidatePath("/designs");
    void track(
      EVENTS.DESIGN_REVIEW_HIDDEN,
      { reviewId: id, designId: review.designId, reason },
      { userId: admin.id, level: "INFO" },
    );
    return { ok: true };
  } catch (err) {
    void logError(err, { source: "action:hide-review", severity: "MEDIUM" });
    return { ok: false, error: "Yorum gizlenemedi." };
  }
}

export async function restoreReview(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const id = String(formData.get("reviewId") ?? "").trim();
    if (!id) return { ok: false, error: "Yorum bulunamadı." };

    const review = await prisma.designReview.update({
      where: { id },
      data: { status: "APPROVED", hiddenReason: null },
      select: { designId: true, design: { select: { slug: true } } },
    });

    revalidatePath("/admin/reviews");
    revalidatePath(`/designs/${review.design.slug}`);
    revalidatePath("/designs");
    void track(
      EVENTS.DESIGN_REVIEW_RESTORED,
      { reviewId: id, designId: review.designId },
      { userId: admin.id, level: "INFO" },
    );
    return { ok: true };
  } catch (err) {
    void logError(err, { source: "action:restore-review", severity: "MEDIUM" });
    return { ok: false, error: "Yorum geri alınamadı." };
  }
}
