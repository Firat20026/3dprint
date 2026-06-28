import { UserMenu } from "@/components/site/UserMenu";
import { MobileNav } from "@/components/site/MobileNav";
import { NavShell } from "@/components/site/NavShell";
import { auth } from "@/lib/auth";

// AI üret + Dosya yükle geçici olarak kapalı, kredi/fiyatlandırma gizlendi —
// menüde yalnızca katalog ve "nasıl çalışır" var.
const baseLinks = [
  { href: "/designs", label: "Tasarımlar" },
  { href: "/how-it-works", label: "Nasıl Çalışır" },
];

const guestOnlyLinks: { href: string; label: string }[] = [];

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
