"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { track, logError } from "@/lib/observability";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function markEarningPaid(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const id = String(formData.get("earningId") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim() || null;
    if (!id) return { ok: false, error: "Kayıt bulunamadı." };

    const updated = await prisma.designerEarning.updateMany({
      where: { id, status: "PENDING_PAYOUT" },
      data: {
        status: "PAID_OUT",
        paidOutAt: new Date(),
        paidOutNote: note,
      },
    });

    if (updated.count === 0) {
      return { ok: false, error: "Bu kayıt zaten ödenmiş ya da bulunamadı." };
    }

    const earning = await prisma.designerEarning.findUnique({
      where: { id },
      select: { designerId: true, designId: true, amountTRY: true },
    });

    revalidatePath("/admin/earnings");
    revalidatePath("/account/earnings");

    void track(
      "DESIGNER_EARNING_PAID_OUT",
      {
        earningId: id,
        designerId: earning?.designerId,
        designId: earning?.designId,
        amountTRY: earning ? Number(earning.amountTRY) : null,
      },
      { userId: admin.id, level: "INFO" },
    );
    return { ok: true };
  } catch (err) {
    void logError(err, { source: "action:mark-earning-paid", severity: "MEDIUM" });
    return { ok: false, error: "İşlem başarısız." };
  }
}
