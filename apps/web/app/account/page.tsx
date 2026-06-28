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
  ShieldCheck,
  Mail,
  CalendarDays,
  ShoppingBag,
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

  const [user, orderCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
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
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Bilgilerini güncelle ve siparişlerini tek yerden takip et.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Profile card */}
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[#1d4ed8] text-xl font-semibold text-white">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-foreground">
                  {user.name ?? user.email.split("@")[0]}
                </h2>
                {user.role === "ADMIN" && (
                  <Badge tone="accent">
                    <ShieldCheck className="size-3" />
                    Admin
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="size-3" />
                {user.email}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground/70">
                <CalendarDays className="size-3" />
                {joined} tarihinde katıldı
              </p>
            </div>
          </div>

          <form
            action={updateProfile}
            className="mt-6 grid gap-4 border-t border-border pt-6"
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
              <p className="mt-1 text-xs text-muted-foreground/70">
                Siparişlerde bu ad görünür.
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
              <p className="mt-1 text-xs text-muted-foreground/70">
                E-postanı değiştirmek için destekle iletişime geç.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton pendingLabel="Kaydediliyor...">Kaydet</SubmitButton>
              <Link
                href="/account/settings"
                className="text-xs text-muted-foreground hover:font-medium text-foreground hover:underline"
              >
                Detaylı ayarlar (telefon, adres, şifre) →
              </Link>
            </div>
          </form>
        </section>

        {/* Orders + catalog */}
        <aside className="flex flex-col gap-5">
          <Link
            href="/account/orders"
            className="group hover-lift rounded-xl border border-border bg-card p-6 hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Siparişlerim</p>
                <p className="mt-2 font-display text-4xl text-foreground">
                  {orderCount}
                </p>
              </div>
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-secondary text-primary transition-transform duration-300 group-hover:scale-110">
                <Package className="size-5" />
              </span>
            </div>
            <span className="mt-3 inline-flex text-xs font-medium text-foreground hover:underline">
              Siparişlerimi gör →
            </span>
          </Link>

          <Link
            href="/designs"
            className="group hover-lift rounded-xl border border-border bg-card p-6 hover:border-primary/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Katalog</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Hazır tasarımlara göz at, beğendiğini sipariş ver.
                </p>
              </div>
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-secondary text-primary transition-transform duration-300 group-hover:scale-110">
                <ShoppingBag className="size-5" />
              </span>
            </div>
            <span className="mt-3 inline-flex text-xs font-medium text-foreground hover:underline">
              Kataloğa git →
            </span>
          </Link>
        </aside>
      </div>
    </Container>
  );
}
