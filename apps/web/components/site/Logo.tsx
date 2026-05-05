"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Brand mark — monochrome with a Watermelon-style tap/hover micro-interaction:
 * gentle scale on hover, deeper press on tap, spring-eased.
 */
export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { mark: "h-6 w-6", inner: "h-2 w-2", text: "text-base" },
    md: { mark: "h-7 w-7", inner: "h-2.5 w-2.5", text: "text-lg" },
    lg: { mark: "h-9 w-9", inner: "h-3.5 w-3.5", text: "text-xl" },
  } as const;
  const s = sizes[size];

  return (
    <Link
      href="/"
      aria-label="frint3d ana sayfa"
      className={cn("group inline-flex items-center gap-2 text-foreground", className)}
    >
      <motion.span
        whileHover={{ scale: 1.06, rotate: -3 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className={cn(
          "relative inline-flex items-center justify-center rounded-md bg-foreground",
          s.mark
        )}
      >
        <span className={cn("rounded-[2px] bg-background", s.inner)} />
      </motion.span>
      <span className={cn("font-display font-semibold tracking-tight", s.text)}>
        frint<span className="text-muted-foreground">3d</span>
      </span>
    </Link>
  );
}
