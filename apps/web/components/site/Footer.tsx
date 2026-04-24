import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/site/Logo";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-[var(--color-border)]/60 bg-[var(--color-surface)]">
      <Container className="grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--color-text-muted)]">
            Türkiye&rsquo;de bulutta tasarla, dakikalar içinde 3 boyutlu bas. Hazır
            tasarımlar, kendi dosyan veya AI ile üretim — hepsi tek panelden.
          </p>
        </div>
        <FooterCol
          title="Ürün"
          links={[
            { href: "/designs", label: "Tasarımlar" },
            { href: "/upload", label: "Dosya Yükle" },
            { href: "/ai", label: "AI Üret" },
            { href: "/pricing", label: "Krediler" },
          ]}
        />
        <FooterCol
          title="Şirket"
          links={[
            { href: "/how-it-works", label: "Nasıl Çalışır" },
            { href: "/contact", label: "İletişim" },
            { href: "/legal/kvkk", label: "KVKK" },
            { href: "/legal/terms", label: "Koşullar" },
          ]}
        />
      </Container>
      <div className="border-t border-[var(--color-border)]/60">
        <Container className="flex flex-col items-start justify-between gap-3 py-5 text-xs text-[var(--color-text-subtle)] md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} frint3d — Türkiye</span>
          <span>Snapmaker U1 · OrcaSlicer · iyzico</span>
        </Container>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text)]">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
