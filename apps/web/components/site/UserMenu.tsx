import Link from "next/link";
import type { Session } from "next-auth";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CartButton } from "@/components/site/CartButton";
import { ProfileMenu } from "@/components/site/ProfileMenu";

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
          className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex sm:items-center"
        >
          Giriş
        </Link>
        <Link href="/register" className="hidden sm:block">
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
      <CartButton />
      <ProfileMenu
        initial={initial}
        name={session.user.name ?? null}
        email={session.user.email ?? ""}
        isAdmin={isAdmin}
        logoutAction={logout}
      />
    </div>
  );
}
