import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/site/Logo";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-card/40">
      <Container className="grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Türkiye&rsquo;de bulutta tasarla, dakikalar içinde 3 boyutlu bas. Hazır
            tasarımlar, kendi dosyan veya AI ile üretim — hepsi tek panelden.
          </p>
          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex h-7 items-center rounded-md border border-border bg-secondary px-2.5 font-medium">
              Snapmaker U1
            </span>
            <span className="inline-flex h-7 items-center rounded-md border border-border bg-secondary px-2.5 font-medium">
              OrcaSlicer
            </span>
            <span className="inline-flex h-7 items-center rounded-md border border-border bg-secondary px-2.5 font-medium">
              iyzico
            </span>
          </div>
        </div>
        <FooterCol
          className="md:col-span-2 md:col-start-7"
          title="Ürün"
          links={[
            { href: "/designs", label: "Tasarımlar" },
            { href: "/upload", label: "Dosya Yükle" },
            { href: "/ai", label: "AI Üret" },
            { href: "/pricing", label: "Krediler" },
          ]}
        />
        <FooterCol
          className="md:col-span-2"
          title="Şirket"
          links={[
            { href: "/how-it-works", label: "Nasıl Çalışır" },
            { href: "/designers", label: "Tasarımcılar" },
            { href: "/contact", label: "İletişim" },
          ]}
        />
        <FooterCol
          className="md:col-span-2"
          title="Yasal"
          links={[
            { href: "/legal/kvkk", label: "KVKK" },
            { href: "/legal/terms", label: "Koşullar" },
            { href: "/legal/privacy", label: "Gizlilik" },
            { href: "/legal/cookies", label: "Çerezler" },
          ]}
        />
      </Container>
      <div className="border-t border-border">
        <Container className="flex flex-col items-start justify-between gap-3 py-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} frint3d — Türkiye</span>
          <span>3D baskı, sade ve hızlı</span>
        </Container>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
  className,
}: {
  title: string;
  links: { href: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
