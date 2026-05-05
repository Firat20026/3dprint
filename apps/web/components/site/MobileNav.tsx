"use client";

/**
 * Mobile navigation drawer — Watermelon-style motion micro-interactions.
 *
 * - Animated hamburger ↔ X icon
 * - Backdrop fades in, sheet slides from right with spring
 * - Link list staggers in from the right (one-by-one) on open
 * - Each link has a hover-reveal pill background with motion
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";

interface NavLink {
  href: string;
  label: string;
}

interface MobileNavProps {
  links: NavLink[];
  loggedIn: boolean;
  isAdmin?: boolean;
}

export function MobileNav({ links, loggedIn, isAdmin }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer when route changes (link click → SPA navigate)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <X className="size-4" />
            </motion.span>
          ) : (
            <motion.span
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Menu className="size-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              // pointer-events-auto explicit — motion can drop pointer events
              // mid-opacity-transition otherwise; without it the backdrop click
              // wouldn't always close the drawer.
              className="pointer-events-auto fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden
            />

            <motion.aside
              key="panel"
              role="dialog"
              aria-label="Menü"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed right-0 top-0 z-50 flex h-dvh w-[88vw] max-w-sm flex-col border-l border-border bg-card shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-border p-5">
                <Logo />
                <button
                  type="button"
                  aria-label="Menüyü kapat"
                  onClick={() => setOpen(false)}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <motion.ul
                className="flex-1 space-y-1 overflow-y-auto p-3"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
                  hidden: {},
                }}
              >
                {links.map((l) => {
                  const active = isActive(pathname, l.href);
                  return (
                    <motion.li
                      key={l.href}
                      variants={{
                        hidden: { opacity: 0, x: 20 },
                        visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 380, damping: 32 } },
                      }}
                    >
                      <Link
                        href={l.href}
                        className={
                          "group flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors " +
                          (active
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground")
                        }
                      >
                        <span>{l.label}</span>
                        <ChevronRight className="size-4 opacity-50 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </motion.li>
                  );
                })}

                {isAdmin && (
                  <motion.li
                    variants={{
                      hidden: { opacity: 0, x: 20 },
                      visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 380, damping: 32 } },
                    }}
                    className="mt-3 border-t border-border pt-3"
                  >
                    <Link
                      href="/admin"
                      className="group flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      <span className="flex items-center gap-2">
                        <Shield className="size-4 opacity-70" />
                        Admin Panel
                      </span>
                      <ChevronRight className="size-4 opacity-50 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </motion.li>
                )}
              </motion.ul>

              <motion.div
                className="space-y-2 border-t border-border bg-secondary/30 p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {loggedIn ? (
                  <Link href="/account" className="block">
                    <Button variant="secondary" className="w-full">
                      Hesabım
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register" className="block">
                      <Button className="w-full">Üye Ol</Button>
                    </Link>
                    <Link href="/login" className="block">
                      <Button variant="secondary" className="w-full">
                        Giriş Yap
                      </Button>
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
