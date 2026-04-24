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
    <div className="overflow-hidden rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)]">
      {/* Card body — links to detail page */}
      <Link
        href={`/admin/orders/${orderId}`}
        className="block p-3 transition-colors hover:bg-[var(--color-surface)]"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
            #{orderId.slice(-8).toUpperCase()}
          </p>
          <OrderStatusBadge status={status} />
        </div>
        <p className="mt-1.5 text-sm font-medium text-[var(--color-text)]">
          {customerName ?? "—"}
        </p>
        <ul className="mt-2 space-y-1 text-xs text-[var(--color-text-muted)]">
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
            <li className="text-[var(--color-text-subtle)]">+{items.length - 3} daha</li>
          )}
        </ul>
        <p className="mt-2 font-display text-sm uppercase tracking-tight">
          ₺{Number(totalTRY).toFixed(2)}
        </p>
      </Link>

      {/* Action area */}
      {transition && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 space-y-2">
          {needsCargo && (
            <>
              <input
                placeholder="Kargo firması (opsiyonel)"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand)] focus:outline-none"
              />
              <input
                placeholder="Takip no *"
                value={trackingNo}
                onChange={(e) => setTrackingNo(e.target.value)}
                className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-brand)] focus:outline-none"
              />
            </>
          )}
          <button
            onClick={advance}
            disabled={pending}
            className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--color-brand)] px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "İşleniyor…" : transition.label}
            {!pending && <ArrowRight className="size-3" />}
          </button>
          {error && (
            <p className="text-[10px] text-[var(--color-danger)]">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
