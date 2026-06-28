import Link from "next/link";
import { Lock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

/**
 * "Yakında" lock screen — used for features that are temporarily disabled
 * (AI generation, file upload). Keeps the route reachable but blocks the
 * feature without 404'ing, and points users back to the catalog.
 */
export function ComingSoon({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Container className="py-20 animate-fade-in md:py-28">
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-10 text-center sm:p-14">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border bg-secondary">
          <Lock className="size-5 text-muted-foreground" />
        </div>
        <p className="eyebrow mt-6">{eyebrow}</p>
        <h1 className="mt-3 h-display text-3xl md:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/designs">
            <Button size="md">Hazır Tasarımlara Göz At</Button>
          </Link>
          <Link href="/">
            <Button size="md" variant="secondary">
              Ana Sayfa
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
