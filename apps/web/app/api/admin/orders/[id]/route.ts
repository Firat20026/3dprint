/**
 * PATCH /api/admin/orders/[id]
 *
 * Admin-only. Order status/cargo bilgisi günceller.
 * Izinli transition'lar: PAID → IN_QUEUE → PRINTING → SHIPPED → DELIVERED,
 *   veya CANCELED (PENDING_PAYMENT dışında herhangi bir state'ten).
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { OrderStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_FORWARD: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CANCELED"],
  PAID: ["IN_QUEUE", "CANCELED"],
  IN_QUEUE: ["PRINTING", "CANCELED"],
  PRINTING: ["SHIPPED", "CANCELED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELED: [],
  REFUNDED: [],
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "json body required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const newStatus = body.status as OrderStatus | undefined;
  if (!newStatus || !ALLOWED_FORWARD[order.status].includes(newStatus)) {
    return NextResponse.json(
      { error: `transition ${order.status} → ${newStatus} not allowed` },
      { status: 400 },
    );
  }

  const updates: Parameters<typeof prisma.order.update>[0]["data"] = {
    status: newStatus,
  };

  if (newStatus === "SHIPPED") {
    if (!body.cargoTrackingNo) {
      return NextResponse.json({ error: "cargoTrackingNo required" }, { status: 400 });
    }
    updates.cargoCarrier = body.cargoCarrier ?? null;
    updates.cargoTrackingNo = body.cargoTrackingNo;
    updates.shippedAt = new Date();
  }

  await prisma.order.update({ where: { id }, data: updates });

  return NextResponse.json({ ok: true });
}
