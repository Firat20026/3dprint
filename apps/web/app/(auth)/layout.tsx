import Link from "next/link";
import { Logo } from "@/components/site/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[calc(100dvh-4rem)] overflow-hidden py-12">
      <div className="absolute inset-0 bg-dot-grid opacity-50" />
      <div
        aria-hidden
        className="absolute -top-20 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--color-brand) 22%, transparent), transparent 70%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-md px-5">
        <div className="mb-8 flex items-center justify-center">
          <Logo />
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-[var(--color-text-subtle)]">
          Devam ederek <Link href="/legal/terms" className="underline">Koşullar</Link>{" "}
          ve <Link href="/legal/kvkk" className="underline">KVKK</Link>{" "}
          metnini kabul etmiş olursun.
        </p>
      </div>
    </div>
  );
}
