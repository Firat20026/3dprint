"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function PurchaseButton({
  packId,
  label = "Satın Al",
}: {
  packId: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function purchase() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ödeme başlatılamadı");
      startTransition(() => {
        window.location.href = data.paymentPageUrl;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
      setLoading(false);
    }
  }

  return (
    <div className="mt-5 space-y-2">
      <Button
        className="w-full"
        onClick={purchase}
        disabled={loading}
      >
        {loading ? "Yönlendiriliyor…" : label}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
