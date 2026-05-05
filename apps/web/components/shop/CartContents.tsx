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
      <div className="h-32 rounded-xl border border-border bg-card" />
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
        <p className="font-display text-xl uppercase tracking-tight">
          Sepetin boş
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
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

      <aside className="h-fit rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg uppercase tracking-tight">Özet</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Ara toplam</dt>
            <dd className="font-medium">₺{subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Kargo</dt>
            <dd className="font-medium">
              {shipping === 0 ? (
                <span className="text-[hsl(var(--success))]">Ücretsiz</span>
              ) : (
                `₺${shipping.toFixed(2)}`
              )}
            </dd>
          </div>
          {shipping > 0 && (
            <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
              ₺{(FREE_SHIPPING_THRESHOLD_TRY - subtotal).toFixed(2)} daha
              ekle → kargo ücretsiz.
            </p>
          )}
          <div className="flex justify-between border-t border-border pt-3 text-base">
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
        <p className="mt-3 text-center text-[10px] text-muted-foreground/70">
          Ödeme iyzico ile güvenli alınır.
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
    <li className="flex gap-4 rounded-xl border border-border bg-card p-4">
      <div className="size-20 shrink-0 overflow-hidden rounded-[10px] bg-secondary">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          // Fallback: stylized placeholder (used when designer didn't upload a
          // thumbnail or for slice-job items which never have one).
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface-3)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-8 text-muted-foreground/70"
              aria-hidden="true"
            >
              <path d="M12 2 4 6.5v11L12 22l8-4.5v-11L12 2Z" />
              <path d="M4.5 6.5 12 11l7.5-4.5M12 11v11" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            {item.kind === "design" ? (
              <Link
                href={`/designs/${item.designSlug}`}
                className="text-sm font-medium hover:text-foreground"
              >
                {item.title}
              </Link>
            ) : (
              <span className="text-sm font-medium">{item.title}</span>
            )}
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-muted-foreground/70 hover:text-destructive"
            >
              Kaldır
            </button>
          </div>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="inline-block size-3 rounded-full border border-white/10"
              style={{ backgroundColor: item.materialColorHex }}
            />
            {item.materialName} · {item.profileName}
            {item.kind === "slice" && (
              <span className="text-muted-foreground/70">
                · {item.filamentGrams.toFixed(1)}g
              </span>
            )}
          </p>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              onClick={() => onQuantity(item.quantity - 1)}
              className="px-3 py-1.5 text-muted-foreground hover:bg-secondary"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onQuantity(item.quantity + 1)}
              className="px-3 py-1.5 text-muted-foreground hover:bg-secondary"
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
