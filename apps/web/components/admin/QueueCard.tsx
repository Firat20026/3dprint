"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type { OrderStatus } from "@prisma/client";
import { ArrowRight } from "lucide-react";

type Snap = { title?: string; material?: { colorHex?: string } };
type Item = { id: string; quantity: number; snapshot: unknown };

const NEXT: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  PAID:      { label: "Kuyruğa Al",          next: "IN_QUEUE"  },
  IN_QUEUE:  { label: "Baskıyı Başlat",       next: "PRINTING"  },
  PRINTING:  { label: "Kargoya Ver",           next: "SHIPPED"   },
  SHIPPED:   { label: "Teslim Edildi",         next: "DELIVERED" },
};

export function QueueCard({
  orderId,
  status,
  customerName,
  items,
  totalTRY,
}: {
  orderId: string;
  status: OrderStatus;
  customerName: string | null;
  items: Item[];
  totalTRY: string | number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [carrier, setCarrier] = useState("");
  const [trackingNo, setTrackingNo] = useState("");

  const transition = NEXT[status];
  const needsCargo = status === "PRINTING";

  async function advance() {
    if (!transition) return;
    setError(null);
    const body: Record<string, unknown> = { status: transition.next };
    if (needsCargo) {
      if (!trackingNo.trim()) { setError("Takip no zorunlu"); return; }
      body.cargoTrackingNo = trackingNo.trim();
      if (carrier.trim()) body.cargoCarrier = carrier.trim();
    }
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-secondary">
      {/* Card body — links to detail page */}
      <Link
        href={`/admin/orders/${orderId}`}
        className="block p-3 transition-colors hover:bg-card"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] text-muted-foreground">
            #{orderId.slice(-8).toUpperCase()}
          </p>
          <OrderStatusBadge status={status} />
        </div>
        <p className="mt-1.5 text-sm font-medium text-foreground">
          {customerName ?? "—"}
        </p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {items.slice(0, 3).map((it) => {
            const snap = (it.snapshot ?? {}) as Snap;
            return (
              <li key={it.id} className="flex items-center gap-1.5">
                {snap.material?.colorHex && (
                  <span
                    className="inline-block size-2 shrink-0 rounded-full border border-white/10"
                    style={{ backgroundColor: snap.material.colorHex }}
                  />
                )}
                <span className="truncate">{snap.title ?? "Ürün"} ×{it.quantity}</span>
              </li>
            );
          })}
          {items.length > 3 && (
            <li className="text-muted-foreground/70">+{items.length - 3} daha</li>
          )}
        </ul>
        <p className="mt-2 font-display text-sm uppercase tracking-tight">
          ₺{Number(totalTRY).toFixed(2)}
        </p>
      </Link>

      {/* Action area */}
      {transition && (
        <div className="border-t border-border bg-card p-3 space-y-2">
          {needsCargo && (
            <>
              <input
                placeholder="Kargo firması (opsiyonel)"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
              />
              <input
                placeholder="Takip no *"
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
              />
            </>
          )}
          <button
            onClick={advance}
            disabled={pending}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "İşleniyor…" : transition.label}
            {!pending && <ArrowRight className="size-3" />}
          </button>
          {error && (
            <p className="text-[10px] text-destructive">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
