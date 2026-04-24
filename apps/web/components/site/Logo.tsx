import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 text-[var(--color-text)]",
        className
      )}
    >
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-[var(--color-brand)] to-[#1d4ed8] shadow-[var(--shadow-glow-brand)]">
        <span className="h-3 w-3 rounded-[3px] bg-[var(--color-bg)]" />
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
      </span>
      <span className="font-display text-2xl tracking-tight uppercase">
        frint<span className="text-[var(--color-brand-2)]">3d</span>
      </span>
    </Link>
  );
}
