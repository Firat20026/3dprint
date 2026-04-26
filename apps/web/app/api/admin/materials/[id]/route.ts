import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Allow-list of fields admins may edit. Anything else (createdAt, id, etc.)
// is silently dropped by Zod's default strip behaviour.
const UpdateMaterialSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    type: z
      .enum([
        "PLA",
        "PETG",
        "TPU",
        "PVA",
        "PCTG",
        "ABS",
        "ASA",
        "PA",
        "PC",
        "PET",
        "CARBON_FIBER",
      ])
      .optional(),
    colorHex: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "renk #RRGGBB formatında olmalı")
      .optional(),
    densityGcm3: z.number().positive().max(10).optional(),
    diameterMm: z.number().positive().max(5).optional(),
    stockGrams: z.number().min(0).optional(),
    pricePerGramTRY: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .strict();

// DELETE /api/admin/materials/:id
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const refs = await prisma.material.findUnique({
    where: { id },
    select: { _count: { select: { sliceJobs: true, cartItems: true } } },
  });

  if (!refs) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }

  const total = refs._count.sliceJobs + refs._count.cartItems;

  if (total > 0) {
    // Has references — soft delete (deactivate)
    await prisma.material.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({
      soft: true,
      message: `${total} kayıtta kullanılıyor; pasife alındı.`,
    });
  }

  await prisma.material.delete({ where: { id } });
  return NextResponse.json({ soft: false });
}

// PATCH /api/admin/materials/:id  — toggle active or full update
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "body required" }, { status: 400 });

  const parsed = UpdateMaterialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  await prisma.material.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}
