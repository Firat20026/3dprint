import { Container } from "@/components/ui/container";
import { Mail, MessageSquare, Building2 } from "lucide-react";

export const metadata = {
  title: "İletişim — frint3d",
  description:
    "Sorularınız, ticari talepleriniz veya destek istekleriniz için bize ulaşın.",
};

export default function ContactPage() {
  return (
    <Container className="py-16">
      <p className="eyebrow">İletişim</p>
      <h1 className="mt-3 h-display text-4xl md:text-5xl">Bize Ulaş</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Sipariş, baskı kalitesi, kurumsal anlaşma veya teknik destek — hangi
        konuda olursa olsun en hızlı dönüşü doğru kanaldan alırsın.
      </p>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        <ContactCard
          icon={<Mail className="size-5" />}
          title="E-posta"
          body="Genel sorular, sipariş takibi"
          action={{ label: "destek@frint3d.com", href: "mailto:destek@frint3d.com" }}
        />
        <ContactCard
          icon={<MessageSquare className="size-5" />}
          title="Whatsapp"
          body="Hızlı cevap, sipariş öncesi danışma"
          action={{
            label: "+90 555 555 55 55",
            href: "https://wa.me/905555555555",
          }}
        />
        <ContactCard
          icon={<Building2 className="size-5" />}
          title="Kurumsal"
          body="Toptan baskı, anlaşmalı kullanım"
          action={{
            label: "kurumsal@frint3d.com",
            href: "mailto:kurumsal@frint3d.com",
          }}
        />
      </div>

      <div className="mt-14 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <h2 className="font-display text-lg uppercase tracking-tight text-foreground">
          Çalışma Saatleri
        </h2>
        <ul className="mt-3 space-y-1">
          <li>Pazartesi – Cuma: 09:00 – 18:00</li>
          <li>Cumartesi: 10:00 – 14:00</li>
          <li>Pazar: kapalı</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground/70">
          Mesai dışı taleplerde dönüş bir sonraki iş günü içinde yapılır. Acil
          durumlar için Whatsapp tercih ediniz.
        </p>
      </div>
    </Container>
  );
}

function ContactCard({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action: { label: string; href: string };
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--color-brand)_18%,transparent)] text-primary">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-lg uppercase tracking-tight">
        {title}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
      <a
        href={action.href}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium font-medium text-foreground hover:underline"
      >
        {action.label} →
      </a>
    </div>
  );
}
