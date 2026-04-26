import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Package,
  Sparkles,
  Upload,
  ShieldCheck,
  Mail,
  CalendarDays,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function updateProfile(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const name = String(formData.get("name") ?? "").trim();
  if (name.length > 80) throw new Error("Ad en fazla 80 karakter");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: name || null },
  });

  revalidatePath("/account");
}

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?redirect=/account");

  const [user, orderCount, designCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credits: true,
        createdAt: true,
      },
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
    prisma.design.count({
      where: { uploaderId: session.user.id, source: "USER_MARKETPLACE" },
    }),
  ]);

  const initial = (user.name ?? user.email).charAt(0).toUpperCase();
  const joined = user.createdAt.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Container className="py-12 animate-fade-in">
      <p className="eyebrow">Hesap</p>
      <h1 className="mt-3 h-display text-4xl md:text-5xl">Profil</h1>
      <p className="mt-3 max-w-2xl text-sm text-[var(--color-text-muted)]">
        Bilgilerini güncelle, siparişlerini ve kredilerini tek yerden takip et.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Profile card */}
        <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[#1d4ed8] text-xl font-semibold text-white">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-[var(--color-text)]">
                  {user.name ?? user.email.split("@")[0]}
                </h2>
                {user.role === "ADMIN" && (
                  <Badge tone="accent">
                    <ShieldCheck className="size-3" />
                    Admin
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Mail className="size-3" />
                {user.email}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-text-subtle)]">
                <CalendarDays className="size-3" />
                {joined} tarihinde katıldı
              </p>
            </div>
          </div>

          <form
            action={updateProfile}
            className="mt-6 grid gap-4 border-t border-[var(--color-border)] pt-6"
          >
            <div>
              <Label htmlFor="name">Görünen Ad</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name ?? ""}
                maxLength={80}
                placeholder="Örn. Fırat"
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                Siparişlerde ve yorumlarında bu ad görünür.
              </p>
            </div>
            <div>
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                name="email"
                value={user.email}
                disabled
                readOnly
                className="mt-1.5 cursor-not-allowed opacity-70"
              />
              <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
                E-postanı değiştirmek için destekle iletişime geç.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton pendingLabel="Kaydediliyor...">Kaydet</SubmitButton>
              <Link
                href="/account/settings"
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-brand-2)] hover:underline"
              >
                Detaylı ayarlar (telefon, TCKN, adres, şifre) →
              </Link>
            </div>
          </form>
        </section>

        {/* Stats + quick links */}
        <aside className="flex flex-col gap-5">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Kredi Bakiyesi</p>
                <p className="mt-2 font-display text-4xl text-[var(--color-text)]">
                  {user.credits}
                </p>
              </div>
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--color-brand)_18%,transparent)] text-[var(--color-brand-2)]">
                <Sparkles className="size-5" />
              </span>
            </div>
            <Link
              href="/account/credits"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand-2)] hover:underline"
            >
              Kredi satın al →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/account/orders"
              className="group hover-lift rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-brand)]/40"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-[var(--color-surface-2)] text-[var(--color-brand-2)] transition-transform duration-300 group-hover:scale-110">
                <Package className="size-4" />
              </span>
              <p className="mt-3 font-display text-2xl text-[var(--color-text)]">
                {orderCount}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">Siparişim</p>
            </Link>
            <Link
              href="/account/my-designs"
              className="group hover-lift rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-brand)]/40"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-[10px] bg-[var(--color-surface-2)] text-[var(--color-brand-2)] transition-transform duration-300 group-hover:scale-110">
                <Upload className="size-4" />
              </span>
              <p className="mt-3 font-display text-2xl text-[var(--color-text)]">
                {designCount}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">Tasarımım</p>
            </Link>
          </div>
        </aside>
      </div>
    </Container>
  );
}
