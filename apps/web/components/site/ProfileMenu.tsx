"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { User as UserIcon, LogOut } from "lucide-react";

interface ProfileMenuProps {
  initial: string;
  name: string | null;
  email: string;
  logoutAction: () => void | Promise<void>;
}

export function ProfileMenu({
  initial,
  name,
  email,
  logoutAction,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Profil menüsü"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[#1d4ed8] text-sm font-semibold text-white transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/60 focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]"
      >
        {initial}
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-in-scale absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        >
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3">
            <p className="line-clamp-1 text-sm font-medium text-[var(--color-text)]">
              {name ?? email.split("@")[0]}
            </p>
            <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-text-muted)]">
              {email}
            </p>
          </div>
          <div className="py-1">
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
            >
              <UserIcon className="size-4 text-[var(--color-text-muted)]" />
              Profil
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
              >
                <LogOut className="size-4 text-[var(--color-text-muted)]" />
                Çıkış yap
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
