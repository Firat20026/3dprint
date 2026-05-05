"use client";

/**
 * Floating "pill" navbar that shrinks on scroll — Watermelon-style.
 *
 * - Fixed at the top, centered, max-w'd (no edge-to-edge bar)
 * - Pill background with backdrop-blur, soft border, subtle shadow
 * - On scroll past ~16px the pill scales down a touch, tightens its padding,
 *   and the border / shadow firm up — the same "settle" micro-interaction
 *   you see on Linear / Watermelon docs site
 * - Auto-hides the desktop nav links on small screens; the MobileNav drawer
 *   takes over there
 */
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Logo } from "@/components/site/Logo";
import { NavLinks } from "@/components/site/NavLinks";

interface NavLink {
  href: string;
  label: string;
}

interface NavShellProps {
  links: NavLink[];
  rightSlot: React.ReactNode;
  mobileSlot: React.ReactNode;
}

export function NavShell({ links, rightSlot, mobileSlot }: NavShellProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-3 z-40 flex justify-center px-3 sm:top-4 sm:px-4">
      <motion.div
        animate={{
          scale: scrolled ? 0.985 : 1,
          y: scrolled ? -1 : 0,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className={
          "pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-2xl border bg-card/75 backdrop-blur-xl backdrop-saturate-150 transition-[padding,border-color,box-shadow] " +
          (scrolled
            ? "border-border/90 px-3 py-1.5 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.5)] sm:px-4 sm:py-2"
            : "border-border/60 px-4 py-2 shadow-[0_4px_20px_-12px_rgb(0_0_0/0.4)] sm:px-5 sm:py-2.5")
        }
      >
        <div className="flex items-center gap-6 lg:gap-8">
          <Logo size="sm" />
          <NavLinks links={links} />
        </div>
        <div className="flex items-center gap-2">
          {rightSlot}
          {mobileSlot}
        </div>
      </motion.div>
    </header>
  );
}
