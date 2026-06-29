import { ArrowUpRight } from "lucide-react";
import { NavShell } from "@/components/site/NavShell";
import { STORE_URL } from "@/lib/store";

// Sade landing — login/hesap yok. Sadece Shopier mağazasına götüren buton.
export function Nav() {
  return (
    <NavShell
      links={[]}
      rightSlot={
        <a
          href={STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Mağazaya Git
          <ArrowUpRight className="size-4" />
        </a>
      }
      mobileSlot={null}
    />
  );
}
