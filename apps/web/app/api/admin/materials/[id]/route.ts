import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  await prisma.material.update({ where: { id }, data: body });
  return NextResponse.json({ ok: true });
}
