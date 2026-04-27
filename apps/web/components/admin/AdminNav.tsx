"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/designs", label: "Tasarımlar" },
  { href: "/admin/orders", label: "Siparişler" },
  { href: "/admin/queue", label: "Baskı Kuyruğu" },
  { href: "/admin/users", label: "Kullanıcılar" },
  { href: "/admin/materials", label: "Materyaller" },
  { href: "/admin/profiles", label: "Baskı Profilleri" },
  { href: "/admin/observability", label: "Olaylar & Hatalar" },
  { href: "/admin/settings", label: "Ayarlar" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-3">
      {sections.map((s) => {
        // exact match for dashboard, startsWith for others
        const active =
          s.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            className={
              "rounded-md px-3 py-1.5 text-sm transition-colors " +
              (active
                ? "bg-[var(--color-brand)]/10 text-[var(--color-brand-2)] font-medium"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]")
            }
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
