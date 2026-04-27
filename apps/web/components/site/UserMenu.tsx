import Link from "next/link";
import type { Session } from "next-auth";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CartButton } from "@/components/site/CartButton";
import { ProfileMenu } from "@/components/site/ProfileMenu";

// Accepts session as a prop to avoid a duplicate auth() call. If omitted
// (legacy callers), falls back to its own auth() — but Nav now passes it
// and Nav is the only call-site.
export async function UserMenu({
  session: sessionProp,
}: { session?: Session | null } = {}) {
  const session = sessionProp ?? (await auth());

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <CartButton />
        <Link
          href="/login"
          className="hidden text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] sm:inline-flex sm:items-center sm:px-3"
        >
          Giriş
        </Link>
        <Link href="/register">
          <Button size="sm">Üye Ol</Button>
        </Link>
      </div>
    );
  }

  const initial = (session.user.name ?? session.user.email ?? "?")
    .charAt(0)
    .toUpperCase();
  const isAdmin = session.user.role === "ADMIN";

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link
          href="/admin"
          className="hidden text-xs uppercase tracking-wider text-[var(--color-accent)] hover:underline sm:inline-flex sm:items-center sm:px-2"
        >
          Admin
        </Link>
      )}
      <Link
        href="/account/orders"
        className="hidden text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] sm:inline-flex sm:items-center sm:px-2"
      >
        Siparişler
      </Link>
      <Link
        href="/account/credits"
        className="hidden text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] sm:inline-flex sm:items-center sm:px-2"
      >
        Krediler
      </Link>
      <Link
        href="/account/my-designs"
        className="hidden text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] lg:inline-flex lg:items-center lg:px-2"
      >
        Tasarımlar
      </Link>
      <CartButton />
      <ProfileMenu
        initial={initial}
        name={session.user.name ?? null}
        email={session.user.email ?? ""}
        logoutAction={logout}
      />
    </div>
  );
}
