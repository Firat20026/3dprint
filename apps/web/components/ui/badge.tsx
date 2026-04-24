import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "brand" | "accent" | "success";
}) {
  const tones = {
    default:
      "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]",
    brand:
      "bg-[color-mix(in_oklab,var(--color-brand)_18%,transparent)] text-[var(--color-brand-2)] border-[color-mix(in_oklab,var(--color-brand)_30%,transparent)]",
    accent:
      "bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)] text-[var(--color-accent)] border-[color-mix(in_oklab,var(--color-accent)_30%,transparent)]",
    success:
      "bg-[color-mix(in_oklab,var(--color-success)_18%,transparent)] text-[var(--color-success)] border-[color-mix(in_oklab,var(--color-success)_30%,transparent)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
