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
import { track, EVENTS, logError } from "@/lib/observability";
import { notify, TEMPLATES } from "@/lib/notifications";

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

  const now = new Date();
  const updates: Parameters<typeof prisma.order.update>[0]["data"] = {
    status: newStatus,
  };

  if (newStatus === "PRINTING") {
    updates.printingStartedAt = now;
  }
  if (newStatus === "SHIPPED") {
    if (!body.cargoTrackingNo) {
      return NextResponse.json({ error: "cargoTrackingNo required" }, { status: 400 });
    }
    updates.cargoCarrier = body.cargoCarrier ?? null;
    updates.cargoTrackingNo = body.cargoTrackingNo;
    updates.shippedAt = now;
  }
  if (newStatus === "DELIVERED") {
    updates.deliveredAt = now;
  }
  if (newStatus === "CANCELED") {
    updates.canceledAt = now;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: updates,
    select: {
      id: true,
      userId: true,
      cargoCarrier: true,
      cargoTrackingNo: true,
      user: { select: { email: true } },
    },
  });

  void track(
    EVENTS.ORDER_STATUS_CHANGED,
    { orderId: id, from: order.status, to: newStatus },
    { userId: updated.userId, level: "INFO" },
  );

  // Customer-facing emails — best-effort, never block the response.
  if (newStatus === "SHIPPED" && updated.user.email) {
    void notify({
      to: updated.user.email,
      template: TEMPLATES.ORDER_SHIPPED,
      data: {
        orderId: id,
        cargoCarrier: updated.cargoCarrier,
        cargoTrackingNo: updated.cargoTrackingNo,
      },
    }).catch((e) =>
      logError(e, {
        source: "api:admin:orders:notify-shipped",
        severity: "LOW",
        metadata: { orderId: id },
      }),
    );
  }

  return NextResponse.json({ ok: true });
}
