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
            Aradığın tasarım burada.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
            Kataloğu keşfet, beğendiğini Shopier güvencesiyle sipariş ver.
            Türkiye geneli hızlı kargo.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/designs" className="w-full sm:w-auto">
              <Button size="md" className="w-full">
                Tasarımları Gör
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="md" variant="secondary" className="w-full">
                Ücretsiz Üye Ol
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
