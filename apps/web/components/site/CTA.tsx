import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="relative py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] border border-[var(--color-brand)]/30 bg-gradient-to-br from-[#0e1832] via-[var(--color-surface)] to-[var(--color-surface)] p-10 md:p-16">
          <div
            aria-hidden
            className="absolute -inset-x-20 -top-32 h-[400px] rounded-full animate-glow-pulse"
            style={{
              background:
                "radial-gradient(closest-side, color-mix(in oklab, var(--color-brand) 35%, transparent), transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="h-display text-4xl text-[var(--color-text)] sm:text-5xl">
              Bir fikrin var mı?
              <br />
              <span className="animate-gradient-pan bg-gradient-to-r from-[var(--color-brand-2)] via-[var(--color-brand)] to-[var(--color-brand-2)] bg-clip-text text-transparent">
                Bugün üretelim.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-[var(--color-text-muted)]">
              Üye ol, ilk siparişinde kargo bizden. Kredi paketlerinde başlangıç
              fırsatları seni bekliyor.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className="group">
                <Button size="xl" className="min-w-[180px]">
                  Ücretsiz Üye Ol
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/upload">
                <Button size="xl" variant="secondary" className="min-w-[180px]">
                  Hemen Yükle
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
