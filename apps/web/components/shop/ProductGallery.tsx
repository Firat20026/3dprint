"use client";

import { useState } from "react";

/** Simple image gallery for the product detail page — main image + clickable
 *  thumbnail strip. Pure client state, no external deps. */
export function ProductGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0] ?? null;

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary">
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={main} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wider text-muted-foreground/70">
            Görsel yok
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Görsel ${i + 1}`}
              className={
                "relative size-16 overflow-hidden rounded-lg border transition-colors " +
                (i === active
                  ? "border-foreground"
                  : "border-border hover:border-foreground/40")
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
