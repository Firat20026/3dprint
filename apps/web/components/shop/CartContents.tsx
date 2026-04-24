"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart, type CartItem } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { publicUrlFor } from "@/lib/urls";

const SHIPPING_FLAT_TRY = 80;
const FREE_SHIPPING_THRESHOLD_TRY = 500;

export function CartContents() {
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const subtotal = useCart((s) => s.subtotalTRY());

  // localStorage hidrasyon — SSR'da empty göster
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="h-32 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]" />
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
        <p className="font-display text-xl uppercase tracking-tight">
          Sepetin boş
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Kataloğa bak ve bir tasarım seç.
        </p>
        <Link href="/designs" className="mt-5 inline-block">
          <Button>Tasarımları Gör</Button>
        </Link>
      </div>
    );
  }

  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD_TRY ? 0 : SHIPPING_FLAT_TRY;
  const total = subtotal + shipping;

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <ul className="space-y-3">
        {items.map((item) => (
          <CartLine
            key={item.id}
            item={item}
            onQuantity={(q) => updateQuantity(item.id, q)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </ul>

      <aside className="h-fit rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="font-display text-lg uppercase tracking-tight">Özet</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--color-text-muted)]">Ara toplam</dt>
            <dd className="font-medium">₺{subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-text-muted)]">Kargo</dt>
            <dd className="font-medium">
              {shipping === 0 ? (
                <span className="text-[var(--color-success)]">Ücretsiz</span>
              ) : (
                `₺${shipping.toFixed(2)}`
              )}
            </dd>
          </div>
          {shipping > 0 && (
            <p className="rounded-md bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
              ₺{(FREE_SHIPPING_THRESHOLD_TRY - subtotal).toFixed(2)} daha
              ekle → kargo ücretsiz.
            </p>
          )}
          <div className="flex justify-between border-t border-[var(--color-border)] pt-3 text-base">
            <dt className="uppercase tracking-wider">Toplam</dt>
            <dd className="font-display text-xl uppercase tracking-tight">
              ₺{total.toFixed(2)}
            </dd>
          </div>
        </dl>
        <Link href="/checkout" className="mt-6 block">
          <Button size="lg" className="w-full">
            Ödemeye Geç
          </Button>
        </Link>
        <p className="mt-3 text-center text-[10px] text-[var(--color-text-subtle)]">
          Ödeme iyzico ile güvenli — Faz 3&apos;te aktif olacak.
        </p>
      </aside>
    </div>
  );
}

function CartLine({
  item,
  onQuantity,
  onRemove,
}: {
  item: CartItem;
  onQuantity: (q: number) => void;
  onRemove: () => void;
}) {
  const thumbUrl = publicUrlFor(item.thumbnailUrl);
  return (
    <li className="flex gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="size-20 shrink-0 overflow-hidden rounded-[10px] bg-[var(--color-surface-2)]">
        {thumbUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            {item.kind === "design" ? (
              <Link
                href={`/designs/${item.designSlug}`}
                className="text-sm font-medium hover:text-[var(--color-brand-2)]"
              >
                {item.title}
              </Link>
            ) : (
              <span className="text-sm font-medium">{item.title}</span>
            )}
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-danger)]"
            >
              Kaldır
            </button>
          </div>
          <p className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <span
              className="inline-block size-3 rounded-full border border-white/10"
              style={{ backgroundColor: item.materialColorHex }}
            />
            {item.materialName} · {item.profileName}
            {item.kind === "slice" && (
              <span className="text-[var(--color-text-subtle)]">
                · {item.filamentGrams.toFixed(1)}g
              </span>
            )}
          </p>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div className="inline-flex items-center overflow-hidden rounded-[var(--radius-button)] border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => onQuantity(item.quantity - 1)}
              className="px-3 py-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onQuantity(item.quantity + 1)}
              className="px-3 py-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
            >
              +
            </button>
          </div>
          <p className="font-display text-lg uppercase tracking-tight">
            ₺{(item.unitPriceTRY * item.quantity).toFixed(2)}
          </p>
        </div>
      </div>
    </li>
  );
}
