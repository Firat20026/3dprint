import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="relative py-20 md:py-28">
      <Container>
        <div className="rounded-xl border border-border bg-card p-10 text-center sm:p-14 md:p-20">
          <h2 className="h-display text-balance text-3xl text-foreground sm:text-4xl">
            Bir fikrin mi var? Bugün üretelim.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
            Üye ol, ilk siparişinde kargo bizden. Kredi paketlerinde başlangıç
            fırsatları seni bekliyor.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="md" className="w-full">
                Ücretsiz Üye Ol
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/upload" className="w-full sm:w-auto">
              <Button size="md" variant="secondary" className="w-full">
                Hemen Yükle
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
