"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleWishlist } from "@/app/actions/wishlist";

type Props = {
  designId: string;
  initial: boolean;
  /** Compact = small overlay heart on cards; default = full button on detail page. */
  variant?: "compact" | "full";
};

export function WishlistButton({ designId, initial, variant = "compact" }: Props) {
  const router = useRouter();
  const [active, setActive] = useState(initial);
  const [pending, startTransition] = useTransition();

  function onClick(e: React.MouseEvent) {
    // Prevent the card link from navigating when the heart is inside an <a>.
    e.preventDefault();
    e.stopPropagation();

    const next = !active;
    setActive(next); // optimistic

    startTransition(async () => {
      const res = await toggleWishlist(designId);
      if (!res.ok) {
        setActive(!next); // revert
        if (res.needsLogin) {
          router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
          return;
        }
        alert(res.error);
        return;
      }
      setActive(res.wishlisted);
    });
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={active}
        aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
        className={
          "inline-flex h-10 items-center gap-2 rounded-[var(--radius-button)] border px-4 text-sm transition-colors disabled:opacity-50 " +
          (active
            ? "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-danger)]/40 hover:text-[var(--color-danger)]")
        }
      >
        <Heart className="size-4" fill={active ? "currentColor" : "none"} />
        {active ? "Favorilerde" : "Favorilere Ekle"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={active}
      aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
      className={
        "inline-flex size-9 items-center justify-center rounded-full border backdrop-blur transition-colors disabled:opacity-50 " +
        (active
          ? "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/15 text-[var(--color-danger)]"
          : "border-white/30 bg-black/40 text-white hover:bg-black/55")
      }
    >
      <Heart className="size-4" fill={active ? "currentColor" : "none"} />
    </button>
  );
}
