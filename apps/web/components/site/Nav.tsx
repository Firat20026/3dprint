import { UserMenu } from "@/components/site/UserMenu";
import { MobileNav } from "@/components/site/MobileNav";
import { NavShell } from "@/components/site/NavShell";
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
  const isAdmin = session?.user?.role === "ADMIN";
  const links = loggedIn ? baseLinks : [...baseLinks, ...guestOnlyLinks];

  return (
    <NavShell
      links={links}
      rightSlot={<UserMenu session={session} />}
      mobileSlot={<MobileNav links={links} loggedIn={loggedIn} isAdmin={isAdmin} />}
    />
  );
}
