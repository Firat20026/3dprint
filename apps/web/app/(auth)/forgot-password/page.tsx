import Link from "next/link";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { prisma } from "@/lib/db";
import { notify, TEMPLATES } from "@/lib/notifications";
import { track, EVENTS } from "@/lib/observability";

export const dynamic = "force-dynamic";

const TOKEN_TTL_MIN = 60;
const SITE_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";

async function requestReset(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();

  if (email && email.includes("@")) {
    // Always issue success regardless of whether the email exists, so
    // attackers can't enumerate which addresses have accounts.
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000);
      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      const resetUrl = SITE_URL
        ? `${SITE_URL}/reset-password/${token}`
        : `/reset-password/${token}`;

      void notify({
        to: user.email,
        template: TEMPLATES.PASSWORD_RESET,
        data: { resetUrl, expiresInMinutes: TOKEN_TTL_MIN },
      });
      void track(
        "PASSWORD_RESET_REQUESTED",
        { tokenIssued: true },
        { userId: user.id },
      );
    } else {
      void track("PASSWORD_RESET_REQUESTED", { tokenIssued: false });
    }
  }

  redirect("/forgot-password?sent=1");
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const sp = await searchParams;
  const sent = sp.sent === "1";

  return (
    <div>
      <h1 className="h-display text-3xl text-foreground">
        Şifremi Unuttum
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        E-posta adresini gir, sıfırlama bağlantısı yollayalım.
      </p>

      {sent ? (
        <div className="mt-6 rounded-xl border border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/10 p-4 text-sm text-[hsl(var(--success))]">
          Eğer bu e-posta hesabımıza kayıtlıysa birkaç dakika içinde
          sıfırlama bağlantısını aldın. Spam klasörünü de kontrol et.
        </div>
      ) : (
        <form action={requestReset} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="forgot-email">E-posta</Label>
            <Input
              id="forgot-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="sen@ornek.com"
              className="mt-1.5"
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            Sıfırlama Bağlantısı Gönder
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        Şifreni hatırladın mı?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
