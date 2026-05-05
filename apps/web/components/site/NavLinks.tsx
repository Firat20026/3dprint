"use client";

/**
 * Desktop nav links with a Watermelon fluid-tabs-style active-pill micro-interaction.
 *
 * - Active link gets a soft pill background that animates between items via
 *   motion's layoutId (the same trick fluid-tabs / framer's NavbarPill use).
 * - Hover reveals the pill on the un-active link with reduced opacity.
 * - We resolve the active link from `usePathname()` rather than props so the
 *   pill follows real route changes without reloads.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

interface NavLink {
  href: string;
  label: string;
}

interface NavLinksProps {
  links: NavLink[];
  className?: string;
}

export function NavLinks({ links, className = "" }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={`relative hidden items-center gap-0.5 lg:flex ${className}`}>
      {links.map((l) => {
        const active = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className="group relative rounded-full px-3.5 py-1.5 text-sm font-medium outline-none transition-colors"
          >
            {active && (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 -z-10 rounded-full bg-secondary"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 32,
                  mass: 0.6,
                }}
              />
            )}
            <span
              className={
                active
                  ? "text-foreground"
                  : "text-muted-foreground transition-colors group-hover:text-foreground"
              }
            >
              {l.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
