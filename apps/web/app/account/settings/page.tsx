/**
 * /account/settings — full profile editor.
 *
 * Two forms:
 *   1. Personal info (name, phone, TCKN, city, address) — used as iyzico
 *      buyer defaults so credit purchases don't ship sandbox dummies anymore.
 *   2. Password change (current + new, bcrypt re-hash).
 *
 * The success/error message is rendered via ?ok=... / ?err=... query params
 * (no client state, no React form libraries — keeps it simple and SSR-friendly).
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Container } from "@/components/ui/container";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sanitizeGsm, sanitizeIdentityNumber, isUserProfileCompleteForIyzico } from "@/lib/iyzico-helpers";
import { track, logError, EVENTS } from "@/lib/observability";

export const dynamic = "force-dynamic";

async function updateProfile(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const name = String(formData.get("name") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const tcknRaw = String(formData.get("identityNumber") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("registrationAddress") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const websiteUrlRaw = String(formData.get("websiteUrl") ?? "").trim();

  if (name.length > 80) {
    redirect("/account/settings?err=name-long");
  }
  if (city.length > 80) {
    redirect("/account/settings?err=city-long");
  }
  if (address.length > 240) {
    redirect("/account/settings?err=address-long");
  }
  if (bio.length > 600) {
    redirect("/account/settings?err=bio-long");
  }

  let websiteUrl: string | null = null;
  if (websiteUrlRaw) {
    try {
      const parsed = new URL(
        /^https?:\/\//i.test(websiteUrlRaw) ? websiteUrlRaw : `https://${websiteUrlRaw}`,
      );
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        redirect("/account/settings?err=website-invalid");
      }
      websiteUrl = parsed.toString();
      if (websiteUrl.length > 240) {
        redirect("/account/settings?err=website-long");
      }
    } catch {
      redirect("/account/settings?err=website-invalid");
    }
  }

  // Optional but if provided must be valid
  let phone: string | null = null;
  if (phoneRaw) {
    const normalized = sanitizeGsm(phoneRaw);
    if (!/^\+90\d{10}$/.test(normalized)) {
      redirect("/account/settings?err=phone-invalid");
    }
    phone = normalized;
  }

  let tckn: string | null = null;
  if (tcknRaw) {
    const normalized = sanitizeIdentityNumber(tcknRaw);
    if (normalized === "11111111111" && tcknRaw !== "11111111111") {
      // sanitize coerced an invalid value into sandbox dummy — reject.
      redirect("/account/settings?err=tckn-invalid");
    }
    tckn = normalized;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name || null,
      phone,
      identityNumber: tckn,
      city: city || null,
      registrationAddress: address || null,
      bio: bio || null,
      websiteUrl,
    },
  });

  void track(EVENTS.USER_PROFILE_UPDATED, {}, { userId: session.user.id });
  revalidatePath("/account");
  revalidatePath("/account/settings");
  redirect("/account/settings?ok=profile");
}

async function changePassword(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next.length < 8) {
    redirect("/account/settings?err=password-short");
  }
  if (next !== confirm) {
    redirect("/account/settings?err=password-mismatch");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });
  if (!user?.passwordHash) {
    redirect("/account/settings?err=no-password");
  }

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) {
    redirect("/account/settings?err=password-current");
  }

  try {
    const newHash = await bcrypt.hash(next, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });
    void track(EVENTS.USER_PASSWORD_CHANGED, {}, { userId: user.id });
  } catch (e) {
    await logError(e, {
      source: "action:change-password",
      severity: "HIGH",
      userId: user.id,
    });
    redirect("/account/settings?err=internal");
  }

  redirect("/account/settings?ok=password");
}

const ERR_MESSAGES: Record<string, string> = {
  "name-long": "Ad en fazla 80 karakter olabilir",
  "city-long": "Şehir en fazla 80 karakter olabilir",
  "address-long": "Adres en fazla 240 karakter olabilir",
  "bio-long": "Tasarımcı tanıtımı en fazla 600 karakter olabilir",
  "website-invalid": "Geçersiz web sitesi adresi",
  "website-long": "Web sitesi adresi çok uzun",
  "phone-invalid": "Telefon +90 ve 10 rakam olmalı (örn. +905551234567)",
  "tckn-invalid": "TCKN 11 hane olmalı",
  "password-short": "Yeni şifre en az 8 karakter olmalı",
  "password-mismatch": "Yeni şifreler eşleşmiyor",
  "password-current": "Mevcut şifre yanlış",
  "no-password": "Bu hesap şifre değişikliğine uygun değil",
  internal: "Beklenmedik hata, lütfen tekrar dene",
};

const OK_MESSAGES: Record<string, string> = {
  profile: "Profil güncellendi",
  password: "Şifre değiştirildi",
};

type SearchParams = Promise<{ ok?: string; err?: string }>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?redirect=/account/settings");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      identityNumber: true,
      city: true,
      registrationAddress: true,
      bio: true,
      websiteUrl: true,
    },
  });

  const hasPublishedDesign = (await prisma.design.count({
    where: { uploaderId: session.user.id, status: "PUBLISHED" },
  })) > 0;

  const params = await searchParams;
  const okMsg = params.ok ? OK_MESSAGES[params.ok] : null;
  const errMsg = params.err ? ERR_MESSAGES[params.err] : null;
  const profileComplete = isUserProfileCompleteForIyzico(user);

  return (
    <Container className="py-12 animate-fade-in">
      <p className="eyebrow">Hesap</p>
      <h1 className="mt-3 h-display text-4xl md:text-5xl">Ayarlar</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Profil bilgilerin (telefon, TCKN, adres) iyzico ödeme formuna otomatik
        gider. Eksiksiz olursa kart hatası riski azalır.
      </p>

      {okMsg && (
        <div className="mt-6 rounded-xl border border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/10 p-3 text-sm text-[hsl(var(--success))]">
          ✓ {okMsg}
        </div>
      )}
      {errMsg && (
        <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          ✗ {errMsg}
        </div>
      )}

      {!profileComplete && (
        <div className="mt-6 rounded-xl border border-foreground/30/40 bg-foreground/10 p-4 text-sm text-muted-foreground">
          <strong>Profil eksik:</strong> Telefon ve TCKN doldurmadan iyzico
          gerçek modunda ödeme reddedilebilir. Sandbox modunda test eder gibi
          çalışır ama production öncesi tamamla.
        </div>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-xl uppercase tracking-tight">
            Kişisel Bilgiler
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            E-posta: <code>{user.email}</code> (değiştirmek için destek)
          </p>
          <form action={updateProfile} className="mt-5 grid gap-4">
            <div>
              <Label htmlFor="name">Ad Soyad</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name ?? ""}
                placeholder="Örn. Fırat Hacıoğlu"
                maxLength={80}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={user.phone ?? ""}
                placeholder="+90 555 123 45 67"
                inputMode="tel"
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground/70">
                Boşsa yazılmayacak. Otomatik +90 ön ekiyle normalize edilir.
              </p>
            </div>
            <div>
              <Label htmlFor="identityNumber">TCKN</Label>
              <Input
                id="identityNumber"
                name="identityNumber"
                defaultValue={user.identityNumber ?? ""}
                placeholder="11 hane"
                inputMode="numeric"
                maxLength={11}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground/70">
                iyzico production gereği. Sadece TR kart sahipleri için.
              </p>
            </div>
            <div>
              <Label htmlFor="city">Şehir</Label>
              <Input
                id="city"
                name="city"
                defaultValue={user.city ?? ""}
                placeholder="İstanbul"
                maxLength={80}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="registrationAddress">Adres</Label>
              <textarea
                id="registrationAddress"
                name="registrationAddress"
                defaultValue={user.registrationAddress ?? ""}
                rows={2}
                maxLength={240}
                placeholder="İlçe, mahalle, sokak..."
                className="mt-1.5 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Public designer fields — shown to everyone but only useful for
                people who upload designs. We always render them so a user
                can prep their profile before publishing the first design. */}
            <div className="border-t border-border pt-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Tasarımcı Profili (herkese açık)
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Tasarımların yayındaysa{" "}
                {hasPublishedDesign ? (
                  <Link
                    href={`/designers/${user.id}`}
                    target="_blank"
                    className="font-medium text-foreground hover:underline"
                  >
                    /designers/{user.id.slice(0, 8)}…
                  </Link>
                ) : (
                  <span className="text-muted-foreground">
                    /designers sayfanda
                  </span>
                )}{" "}
                görünür.
              </p>
            </div>
            <div>
              <Label htmlFor="bio">Tasarımcı Tanıtımı</Label>
              <textarea
                id="bio"
                name="bio"
                defaultValue={user.bio ?? ""}
                rows={3}
                maxLength={600}
                placeholder="Kısa bir tanıtım — uzmanlık, hangi tarz tasarımlar yapıyorsun, vs."
                className="mt-1.5 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted-foreground/70">
                En fazla 600 karakter.
              </p>
            </div>
            <div>
              <Label htmlFor="websiteUrl">Web Sitesi</Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                defaultValue={user.websiteUrl ?? ""}
                placeholder="https://portfolyom.com"
                maxLength={240}
                className="mt-1.5"
              />
            </div>

            <div>
              <SubmitButton pendingLabel="Kaydediliyor...">
                Profili Kaydet
              </SubmitButton>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-xl uppercase tracking-tight">
            Şifre Değiştir
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            En az 8 karakter. Mevcut şifren olmadan değiştirilemez.
          </p>
          <form action={changePassword} className="mt-5 grid gap-4">
            <div>
              <Label htmlFor="current">Mevcut Şifre</Label>
              <Input
                id="current"
                name="current"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="next">Yeni Şifre</Label>
              <Input
                id="next"
                name="next"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="confirm">Yeni Şifre (tekrar)</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1.5"
              />
            </div>
            <div>
              <SubmitButton pendingLabel="Değiştiriliyor...">
                Şifreyi Değiştir
              </SubmitButton>
            </div>
          </form>
        </section>
      </div>

      <div className="mt-8 text-sm">
        <Link
          href="/account"
          className="text-muted-foreground hover:text-foreground"
        >
          ← Hesap profiline dön
        </Link>
      </div>
    </Container>
  );
}
