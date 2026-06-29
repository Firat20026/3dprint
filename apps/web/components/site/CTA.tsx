import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { STORE_URL } from "@/lib/store";

export function CTA() {
  return (
    <section className="relative py-20 md:py-28">
      <Container>
        <div className="rounded-xl border border-border bg-card p-10 text-center sm:p-14 md:p-20">
          <h2 className="h-display text-balance text-3xl text-foreground sm:text-4xl">
            Aradığın tasarım burada.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
            Tüm tasarımlar Shopier mağazamızda. Beğen, güvenle sipariş ver,
            Türkiye geneli hızlı kargoyla kapına gelsin.
          </p>
          <div className="mt-8 flex justify-center">
            <a href={STORE_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg">
                Shopier Mağazasına Git
                <ArrowUpRight className="size-4" />
              </Button>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
