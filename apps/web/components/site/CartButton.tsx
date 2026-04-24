"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { publicUrlFor } from "@/lib/urls";

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

  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD_TRY ? 0 : SHIPPING_FLAT_TRY;

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
        className="relative inline-flex size-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-brand)]/40 hover:text-[var(--color-text)]"
      >
        <ShoppingCart className="size-4" />
        {mounted && count > 0 && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-semibold text-black">
            {count}
          </span>
        )}
      </Link>

      {mounted && open && (
        <div
          role="dialog"
          aria-label="Sepet önizleme"
          className="absolute right-0 top-full z-50 w-[360px] pt-3"
        >
          <div className="animate-fade-in-scale overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
            {items.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-subtle)]">
                  <ShoppingCart className="size-4" />
                </div>
                <p className="mt-3 text-sm font-medium text-[var(--color-text)]">
                  Sepetin boş
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Kataloğa bak ve bir tasarım seç.
                </p>
                <Link
                  href="/designs"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand-2)] hover:underline"
                >
                  Tasarımları Gör
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
                  <span className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
                    Sepet · {count} ürün
                  </span>
                  <Link
                    href="/cart"
                    className="text-xs text-[var(--color-brand-2)] hover:underline"
                  >
                    Tümünü aç
                  </Link>
                </div>

                <ul className="max-h-[320px] divide-y divide-[var(--color-border)] overflow-y-auto">
                  {items.map((item) => {
                    const thumbUrl = publicUrlFor(item.thumbnailUrl);
                    return (
                      <li key={item.id} className="flex gap-3 px-4 py-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-[8px] bg-[var(--color-surface-2)]">
                          {thumbUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumbUrl}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div
                              className="h-full w-full"
                              style={{ background: item.materialColorHex }}
                              aria-hidden
                            />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <span className="line-clamp-1 text-sm font-medium text-[var(--color-text)]">
                              {item.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-[10px] text-[var(--color-text-subtle)] hover:text-[var(--color-danger)]"
                              aria-label="Kaldır"
                            >
                              Kaldır
                            </button>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
                            <span
                              className="inline-block size-2.5 rounded-full border border-white/10"
                              style={{ backgroundColor: item.materialColorHex }}
                            />
                            <span className="line-clamp-1">
                              {item.materialName} · {item.profileName}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="text-[var(--color-text-subtle)]">
                              {item.quantity} × ₺{item.unitPriceTRY.toFixed(2)}
                            </span>
                            <span className="font-medium text-[var(--color-text)]">
                              ₺{(item.unitPriceTRY * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="space-y-2 border-t border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">
                      Ara toplam
                    </span>
                    <span className="font-display text-base text-[var(--color-text)]">
                      ₺{subtotal.toFixed(2)}
                    </span>
                  </div>
                  {shipping > 0 ? (
                    <p className="rounded-md bg-[var(--color-surface)] px-2.5 py-1.5 text-[11px] text-[var(--color-text-muted)]">
                      ₺{(FREE_SHIPPING_THRESHOLD_TRY - subtotal).toFixed(2)} daha
                      ekle → kargo ücretsiz.
                    </p>
                  ) : (
                    <p className="rounded-md bg-[color-mix(in_oklab,var(--color-success)_12%,transparent)] px-2.5 py-1.5 text-[11px] text-[var(--color-success)]">
                      Ücretsiz kargoya ulaştın.
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Link
                      href="/cart"
                      className="flex-1 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-center text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-brand)]/40"
                    >
                      Sepete Git
                    </Link>
                    <Link
                      href="/checkout"
                      className="group flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--color-brand)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-brand-2)]"
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
