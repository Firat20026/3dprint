"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { userIsVerifiedBuyer } from "@/lib/reviews";
import { track, EVENTS, logError } from "@/lib/observability";

const MAX_TITLE = 80;
const MAX_BODY = 2000;

type ActionResult = { ok: true } | { ok: false; error: string };

export async function submitDesignReview(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const designId = String(formData.get("designId") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const ratingRaw = String(formData.get("rating") ?? "");
    const titleRaw = String(formData.get("title") ?? "").trim();
    const bodyRaw = String(formData.get("body") ?? "").trim();

    if (!designId) return { ok: false, error: "Tasarım bulunamadı." };

    const rating = parseInt(ratingRaw, 10);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return { ok: false, error: "Puan 1 ile 5 arasında olmalı." };
    }

    if (titleRaw.length > MAX_TITLE) {
      return { ok: false, error: `Başlık en fazla ${MAX_TITLE} karakter olabilir.` };
    }
    if (bodyRaw.length > MAX_BODY) {
      return { ok: false, error: `Yorum en fazla ${MAX_BODY} karakter olabilir.` };
    }

    const design = await prisma.design.findUnique({
      where: { id: designId },
      select: { id: true, status: true, slug: true },
    });
    if (!design || design.status !== "PUBLISHED") {
      return { ok: false, error: "Tasarım yayında değil." };
    }

    const verified = await userIsVerifiedBuyer(user.id, designId);

    const existing = await prisma.designReview.findUnique({
      where: { designId_userId: { designId, userId: user.id } },
      select: { id: true },
    });

    if (existing) {
      await prisma.designReview.update({
        where: { id: existing.id },
        data: {
          rating,
          title: titleRaw || null,
          body: bodyRaw || null,
          verifiedBuyer: verified,
          // Editing a previously hidden review re-surfaces it; admins can hide
          // again if they object to the new content.
          status: "APPROVED",
          hiddenReason: null,
        },
      });
      void track(
        "DESIGN_REVIEW_UPDATED",
        { designId, rating, verified },
        { userId: user.id, level: "INFO" },
      );
    } else {
      await prisma.designReview.create({
        data: {
          designId,
          userId: user.id,
          rating,
          title: titleRaw || null,
          body: bodyRaw || null,
          verifiedBuyer: verified,
          status: "APPROVED",
        },
      });
      void track(
        "DESIGN_REVIEW_CREATED",
        { designId, rating, verified },
        { userId: user.id, level: "INFO" },
      );
    }

    revalidatePath(`/designs/${slug || design.slug}`);
    revalidatePath("/designs");
    return { ok: true };
  } catch (err) {
    void logError(err, { source: "action:submit-design-review", severity: "MEDIUM" });
    return { ok: false, error: "Yorum kaydedilemedi. Lütfen tekrar dene." };
  }
}

export async function deleteOwnDesignReview(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const reviewId = String(formData.get("reviewId") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();

    const review = await prisma.designReview.findUnique({
      where: { id: reviewId },
      select: { userId: true, designId: true, design: { select: { slug: true } } },
    });
    if (!review || review.userId !== user.id) {
      return { ok: false, error: "Yorum bulunamadı." };
    }

    await prisma.designReview.delete({ where: { id: reviewId } });
    revalidatePath(`/designs/${slug || review.design?.slug || ""}`);
    revalidatePath("/designs");
    void track(
      "DESIGN_REVIEW_DELETED",
      { designId: review.designId },
      { userId: user.id, level: "INFO" },
    );
    return { ok: true };
  } catch (err) {
    void logError(err, { source: "action:delete-design-review", severity: "LOW" });
    return { ok: false, error: "Yorum silinemedi." };
  }
}
