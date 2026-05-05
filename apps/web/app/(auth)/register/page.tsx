import Link from "next/link";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signIn, auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(120),
});

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session?.user) redirect("/");

  async function register(formData: FormData) {
    "use server";
    const parsed = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      redirect("/register?error=invalid");
    }

    const exists = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (exists) {
      redirect("/register?error=exists");
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
      },
    });

    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  }

  const errorMsg =
    params.error === "exists"
      ? "Bu email ile zaten bir hesap var."
      : params.error === "invalid"
        ? "Lütfen alanları doğru doldur."
        : null;

  return (
    <div>
      <h1 className="h-display text-3xl text-foreground">
        Üye Ol
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Zaten hesabın var mı?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground hover:underline"
        >
          Giriş yap
        </Link>
      </p>

      <form action={register} className="mt-7 space-y-4">
        <div>
          <Label htmlFor="name">Ad Soyad</Label>
          <Input
            id="name"
            name="name"
            required
            minLength={2}
            placeholder="Adın Soyadın"
            className="mt-1.5"
          />
        </div>
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
          <Label htmlFor="password">Şifre</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground/70">
            En az 6 karakter.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-[10px] border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full">
          Hesabımı Oluştur
        </Button>
      </form>
    </div>
  );
}
