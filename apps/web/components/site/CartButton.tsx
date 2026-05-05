"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShoppingCart, ArrowRight, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { publicUrlFor } from "@/lib/urls";
import { Badge } from "@/components/ui/badge";

const SHIPPING_FLAT_TRY = 80;
const FREE_SHIPPING_THRESHOLD_TRY = 500;

export function CartButton() {
  const items = useCart((s) => s.items);
  const count = useCart((s) => s.totalItems());
  const subtotal = useCart((s) => s.subtotalTRY());
  const removeItem = useCart((s) => s.removeItem);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const show = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };
  const scheduleHide = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD_TRY ? 0 : SHIPPING_FLAT_TRY;

  return (
    <div
      className="relative"
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      onFocusCapture={show}
      onBlurCapture={scheduleHide}
    >
      <Link
        href="/cart"
        aria-label="Sepet"
        className="relative inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <ShoppingCart className="size-4" />
        {mounted && count > 0 && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-muted-foreground-foreground">
            {count}
          </span>
        )}
      </Link>

      {mounted && open && (
        <div
          role="dialog"
          aria-label="Sepet önizleme"
          className="absolute right-0 top-full z-50 hidden w-[360px] pt-3 md:block"
        >
          <div className="animate-fade-in-scale overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
            {items.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <ShoppingCart className="size-4" />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">Sepetin boş</p>
                <p className="mt-1 text-xs text-muted-foreground">Kataloğa bak ve bir tasarım seç.</p>
                <Link
                  href="/designs"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium font-medium text-foreground hover:underline"
                >
                  Tasarımları Gör
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Sepet · {count} ürün
                  </span>
                  <Link href="/cart" className="text-xs font-medium text-foreground hover:underline">
                    Tümünü aç
                  </Link>
                </div>

                <ul className="max-h-[320px] divide-y divide-border overflow-y-auto">
                  {items.map((item) => {
                    const thumbUrl = publicUrlFor(item.thumbnailUrl);
                    return (
                      <li key={item.id} className="flex gap-3 px-4 py-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                          {thumbUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumbUrl} alt={item.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full" style={{ background: item.materialColorHex }} aria-hidden />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <span className="line-clamp-1 text-sm font-medium text-foreground">{item.title}</span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-muted-foreground hover:text-destructive"
                              aria-label="Kaldır"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span
                              className="inline-block size-2.5 rounded-full border border-border"
                              style={{ backgroundColor: item.materialColorHex }}
                            />
                            <span className="line-clamp-1">
                              {item.materialName} · {item.profileName}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {item.quantity} × ₺{item.unitPriceTRY.toFixed(2)}
                            </span>
                            <span className="font-medium text-foreground">
                              ₺{(item.unitPriceTRY * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="space-y-2 border-t border-border bg-secondary/40 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ara toplam</span>
                    <span className="font-display text-base font-semibold text-foreground">
                      ₺{subtotal.toFixed(2)}
                    </span>
                  </div>
                  {shipping > 0 ? (
                    <p className="rounded-md bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground">
                      ₺{(FREE_SHIPPING_THRESHOLD_TRY - subtotal).toFixed(2)} daha ekle → kargo ücretsiz.
                    </p>
                  ) : (
                    <Badge tone="success" className="w-full justify-center py-1.5">
                      Ücretsiz kargoya ulaştın
                    </Badge>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Link
                      href="/cart"
                      className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-center text-xs font-medium text-foreground transition-colors hover:border-primary/40"
                    >
                      Sepete Git
                    </Link>
                    <Link
                      href="/checkout"
                      className="group flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Ödemeye Geç
                      <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
