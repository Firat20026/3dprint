import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/site/Logo";
import { UserMenu } from "@/components/site/UserMenu";
import { auth } from "@/lib/auth";

const baseLinks = [
  { href: "/designs", label: "Tasarımlar" },
  { href: "/upload", label: "Dosya Yükle" },
  { href: "/ai", label: "AI Üret" },
];

const guestOnlyLinks = [
  { href: "/pricing", label: "Fiyatlandırma" },
  { href: "/how-it-works", label: "Nasıl Çalışır" },
];

export async function Nav() {
  const session = await auth();
  const loggedIn = !!session?.user;
  const links = loggedIn ? baseLinks : [...baseLinks, ...guestOnlyLinks];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)]/60 bg-[color-mix(in_oklab,var(--color-bg)_85%,transparent)] backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <UserMenu />
      </Container>
    </header>
  );
}
