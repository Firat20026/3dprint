"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@prisma/client";

const TRANSITIONS: Record<OrderStatus, { label: string; next: OrderStatus } | null> = {
  PENDING_PAYMENT: null, // only callback can move out of this
  PAID: { label: "Kuyruğa Al", next: "IN_QUEUE" },
  IN_QUEUE: { label: "Baskıyı Başlat", next: "PRINTING" },
  PRINTING: { label: "Kargoya Ver", next: "SHIPPED" },
  SHIPPED: { label: "Teslim Edildi Olarak İşaretle", next: "DELIVERED" },
  DELIVERED: null,
  CANCELED: null,
  REFUNDED: null,
};

export function OrderActions({
  orderId,
  status,
  cargoCarrier,
  cargoTrackingNo,
}: {
  orderId: string;
  status: OrderStatus;
  cargoCarrier: string | null;
  cargoTrackingNo: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [carrier, setCarrier] = useState(cargoCarrier ?? "");
  const [trackingNo, setTrackingNo] = useState(cargoTrackingNo ?? "");

  const transition = TRANSITIONS[status];
  const needsCargoInput = status === "PRINTING"; // ship transition: require tracking

  async function advance(nextStatus: OrderStatus, extra?: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: nextStatus, ...extra }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="mt-3 space-y-3">
      {needsCargoInput && (
        <div className="space-y-2">
          <input
            placeholder="Kargo firması"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs"
          />
          <input
            placeholder="Takip no"
            value={trackingNo}
            onChange={(e) => setTrackingNo(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs"
          />
        </div>
      )}

      {transition ? (
        <Button
          size="sm"
          className="w-full"
          disabled={pending || (needsCargoInput && !trackingNo.trim())}
          onClick={() =>
            advance(
              transition.next,
              needsCargoInput
                ? { cargoCarrier: carrier.trim(), cargoTrackingNo: trackingNo.trim() }
                : undefined,
            )
          }
        >
          {pending ? "Güncelleniyor…" : transition.label}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground/70">
          Bu durumda ilerletilecek aksiyon yok.
        </p>
      )}

      {(status === "IN_QUEUE" || status === "PRINTING" || status === "PAID") && (
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          disabled={pending}
          onClick={() => advance("CANCELED")}
        >
          İptal Et
        </Button>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
