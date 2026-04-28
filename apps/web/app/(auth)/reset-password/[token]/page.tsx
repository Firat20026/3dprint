import Link from "next/link";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { prisma } from "@/lib/db";
import { track } from "@/lib/observability";

export const dynamic = "force-dynamic";

async function consumeReset(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) redirect("/login");
  if (next.length < 8) {
    redirect(`/reset-password/${token}?err=short`);
  }
  if (next !== confirm) {
    redirect(`/reset-password/${token}?err=mismatch`);
  }

  const row = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!row || row.usedAt || row.expiresAt < new Date()) {
    redirect(`/reset-password/${token}?err=invalid`);
  }

  const hash = await bcrypt.hash(next, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: hash },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    // Defensive: invalidate any other live tokens for the same user, so a
    // stolen-but-not-yet-used token can't reset the password later.
    prisma.passwordResetToken.updateMany({
      where: {
        userId: row.userId,
        usedAt: null,
        NOT: { id: row.id },
      },
      data: { usedAt: new Date() },
    }),
  ]);

  void track("PASSWORD_RESET_COMPLETED", {}, { userId: row.userId });
  redirect("/login?reset=ok");
}

const ERR_MESSAGES: Record<string, string> = {
  short: "Yeni şifre en az 8 karakter olmalı",
  mismatch: "Yeni şifreler eşleşmiyor",
  invalid: "Bağlantı geçersiz veya süresi dolmuş — yeniden talep et",
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const errMsg = sp.err ? ERR_MESSAGES[sp.err] : null;

  // Light-touch validation up front so an obviously-invalid link shows a
  // clear message instead of a generic form. Server action re-checks at
  // submit time too.
  const row = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { id: true, expiresAt: true, usedAt: true },
  });
  const tokenInvalid =
    !row || row.usedAt !== null || row.expiresAt < new Date();

  return (
    <div>
      <h1 className="h-display text-3xl text-[var(--color-text)]">
        Yeni Şifre Belirle
      </h1>

      {tokenInvalid ? (
        <>
          <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
            Bu bağlantı geçersiz veya süresi dolmuş. Yeni bir sıfırlama
            bağlantısı talep et.
          </div>
          <Link
            href="/forgot-password"
            className="mt-4 inline-block text-sm text-[var(--color-brand-2)] hover:underline"
          >
            Şifre sıfırlama isteği gönder →
          </Link>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
            Hesabın için yeni bir şifre seç. En az 8 karakter.
          </p>
          {errMsg && (
            <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">
              ✗ {errMsg}
            </div>
          )}
          <form action={consumeReset} className="mt-6 space-y-4">
            <input type="hidden" name="token" value={token} />
            <div>
              <Label htmlFor="reset-next">Yeni Şifre</Label>
              <Input
                id="reset-next"
                name="next"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="reset-confirm">Yeni Şifre (tekrar)</Label>
              <Input
                id="reset-confirm"
                name="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1.5"
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Şifreyi Güncelle
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
