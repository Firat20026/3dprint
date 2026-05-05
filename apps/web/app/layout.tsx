import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFloat } from "@/components/site/WhatsAppFloat";
import { Toaster } from "@/components/ui/sonner";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const SITE_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";
const TITLE = "frint3d — Türkiye'nin 3D Baskı Platformu";
const DESCRIPTION =
  "Hazır tasarımlardan, kendi yüklediğin dosyadan veya AI ile ürettiğin modelden 3 boyutlu baskıyı dakikalar içinde sipariş et. Snapmaker U1 ile çok renkli, çok materyalli üretim.";

export const metadata: Metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  title: {
    default: TITLE,
    template: "%s — frint3d",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "frint3d",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`dark ${jakarta.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh bg-background pt-20 font-sans text-foreground antialiased sm:pt-24">
        <Nav />
        <main>{children}</main>
        <Footer />
        <WhatsAppFloat />
        <Toaster />
      </body>
    </html>
  );
}
