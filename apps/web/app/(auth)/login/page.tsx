import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn, auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { AuthError } from "next-auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string; reset?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session?.user) redirect(params.from ?? "/");

  const googleConfigured =
    !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").toLowerCase().trim();
    const password = String(formData.get("password") ?? "");
    const from = String(formData.get("from") ?? "/");
    try {
      await signIn("credentials", { email, password, redirectTo: from });
    } catch (e) {
      if (e instanceof AuthError) {
        redirect(`/login?from=${encodeURIComponent(from)}&error=invalid`);
      }
      throw e;
    }
  }

  async function loginGoogle(formData: FormData) {
    "use server";
    const from = String(formData.get("from") ?? "/");
    await signIn("google", { redirectTo: from });
  }

  return (
    <div>
      <h1 className="h-display text-3xl text-[var(--color-text)]">
        Giriş Yap
      </h1>
      <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
        Hesabın yok mu?{" "}
        <Link
          href="/register"
          className="text-[var(--color-brand-2)] hover:underline"
        >
          Üye ol
        </Link>
      </p>

      <form action={login} className="mt-7 space-y-4">
        <input type="hidden" name="from" value={params.from ?? "/"} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="sen@ornek.com"
            className="mt-1.5"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Şifre</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-2)]"
            >
              Şifremi unuttum
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="mt-1.5"
          />
        </div>

        {params.error === "invalid" && (
          <div className="rounded-[10px] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-3.5 py-2.5 text-xs text-[var(--color-danger)]">
            Email veya şifre hatalı.
          </div>
        )}
        {params.reset === "ok" && (
          <div className="rounded-[10px] border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-3.5 py-2.5 text-xs text-[var(--color-success)]">
            ✓ Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.
          </div>
        )}

        <Button type="submit" size="lg" className="w-full">
          Giriş Yap
        </Button>
      </form>

      {googleConfigured && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-[var(--color-text-subtle)]">
            <span className="h-px flex-1 bg-[var(--color-border)]" />
            veya
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
          <form action={loginGoogle}>
            <input type="hidden" name="from" value={params.from ?? "/"} />
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="w-full"
            >
              Google ile Devam Et
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
