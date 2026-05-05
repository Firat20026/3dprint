import Link from "next/link";
import { Logo } from "@/components/site/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[calc(100dvh-4rem)] py-12">
      <div className="relative mx-auto w-full max-w-md px-5">
        <div className="mb-8 flex items-center justify-center">
          <Logo />
        </div>
        <div className="rounded-xl border border-border bg-card p-7">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          Devam ederek <Link href="/legal/terms" className="underline">Koşullar</Link>{" "}
          ve <Link href="/legal/kvkk" className="underline">KVKK</Link>{" "}
          metnini kabul etmiş olursun.
        </p>
      </div>
    </div>
  );
}
