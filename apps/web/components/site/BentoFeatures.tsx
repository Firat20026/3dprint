"use client";

/**
 * Bento-style features grid — adapted from Watermelon UI's bento-2 layout DNA.
 *
 * Same 2-column asymmetric flex grid (big + medium / medium + big) and the
 * gradient-title / dark-card aesthetic, but populated with our own copy and
 * inline SVGs instead of the registry's real-estate-themed scenery. Cards
 * lift gently on hover via motion.
 */
import * as React from "react";
import { motion } from "motion/react";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/site/HowItWorks";

export function BentoFeatures() {
  return (
    <section className="relative py-20 md:py-28">
      <Container>
        <SectionHeader
          eyebrow="Öne Çıkan"
          title="Profesyonel hassasiyet, sade akış."
          subtitle="Bir tıkla anlık fiyat, dilersen detaylı kontrol. Profesyonel slicer'ın gücü, e-ticaret rahatlığı."
        />

        <div className="mt-12 flex flex-col gap-4 lg:flex-row lg:gap-5 md:mt-16">
          {/* Left column: big + medium */}
          <div className="flex w-full flex-col gap-4 lg:flex-1 lg:gap-5">
            <BentoCard
              size="big"
              title="Gerçek Slicing"
              body="OrcaSlicer CLI dosyayı saniyeler içinde dilimler. Tahmin değil, kesin gram & saat."
              illustration={<LayeredCube />}
            />
            <BentoCard
              size="medium"
              title="Meshy AI"
              body="Yazıdan veya görselden 3D model üret. Krediler ile öde, beğen, bastır."
              illustration={<AiOrb />}
            />
          </div>

          {/* Right column: medium + big */}
          <div className="flex w-full flex-col gap-4 lg:max-w-[40%] lg:gap-5">
            <BentoCard
              size="medium"
              title="4 Renk · 4 Materyal"
              body="Snapmaker U1 IDEX sistemi sayesinde aynı baskıda 4 farklı renk veya materyal."
              illustration={<MaterialSwatch />}
            />
            <BentoCard
              size="big"
              title="Türkiye Ödeme"
              body="iyzico ile güvenli kart ödemesi, taksit desteği. Türkiye geneli kargo, 500₺ üzeri ücretsiz."
              illustration={<ShieldGlyph />}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function BentoCard({
  title,
  body,
  illustration,
  size,
}: {
  title: string;
  body: string;
  illustration: React.ReactNode;
  size: "big" | "medium";
}) {
  const heightClass = size === "big" ? "min-h-[28rem]" : "min-h-[18rem]";
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 ${heightClass}`}
    >
      <div className="relative z-10">
        <h3 className="bg-gradient-to-r from-foreground to-foreground/55 bg-clip-text text-2xl font-semibold leading-tight tracking-tight text-transparent sm:text-3xl">
          {title}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          {body}
        </p>
      </div>
      <div className="pointer-events-none relative mt-6 flex flex-1 items-end justify-center">
        {illustration}
      </div>
    </motion.div>
  );
}

/* ───── Inline SVG illustrations (cheap, on-brand, theme-aware) ─────── */

function LayeredCube() {
  return (
    <svg viewBox="0 0 320 220" className="h-44 w-full max-w-md sm:h-52" aria-hidden>
      <defs>
        <linearGradient id="bf-cube-top" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="hsl(0 0% 95%)" />
          <stop offset="1" stopColor="hsl(0 0% 65%)" />
        </linearGradient>
        <linearGradient id="bf-cube-left" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="hsl(0 0% 35%)" />
          <stop offset="1" stopColor="hsl(0 0% 22%)" />
        </linearGradient>
        <linearGradient id="bf-cube-right" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="hsl(0 0% 50%)" />
          <stop offset="1" stopColor="hsl(0 0% 30%)" />
        </linearGradient>
      </defs>
      <g transform="translate(40,30)">
        {[0, 12, 24, 36, 48].map((z, i) => (
          <g key={z} transform={`translate(0,${-z})`} opacity={1 - i * 0.14}>
            <polygon points="120,0 240,60 120,120 0,60" fill="url(#bf-cube-top)" />
            <polygon points="0,60 120,120 120,160 0,100" fill="url(#bf-cube-left)" />
            <polygon points="240,60 120,120 120,160 240,100" fill="url(#bf-cube-right)" />
          </g>
        ))}
      </g>
    </svg>
  );
}

function AiOrb() {
  return (
    <svg viewBox="0 0 200 120" className="h-28 w-full max-w-xs sm:h-32" aria-hidden>
      <defs>
        <radialGradient id="bf-orb" cx="40%" cy="35%" r="60%">
          <stop offset="0" stopColor="hsl(0 0% 100%)" />
          <stop offset="1" stopColor="hsl(0 0% 30%)" />
        </radialGradient>
      </defs>
      {/* ring */}
      <circle cx="100" cy="70" r="48" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
      <circle cx="100" cy="70" r="32" fill="url(#bf-orb)" />
      {/* sparkles */}
      <g fill="hsl(var(--foreground))" opacity="0.7">
        <path d="M40 30 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 z" />
        <path d="M165 50 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 z" />
      </g>
    </svg>
  );
}

function MaterialSwatch() {
  const colors = [
    "hsl(0 0% 95%)",
    "hsl(0 0% 30%)",
    "hsl(0 0% 60%)",
    "hsl(0 0% 15%)",
  ];
  return (
    <div className="flex items-end gap-2">
      {colors.map((c, i) => (
        <div
          key={i}
          className="rounded-full border border-border"
          style={{
            width: 36 + i * 4,
            height: 36 + i * 4,
            background: c,
          }}
        />
      ))}
    </div>
  );
}

function ShieldGlyph() {
  return (
    <svg viewBox="0 0 200 200" className="h-44 w-full max-w-sm sm:h-56" aria-hidden>
      <defs>
        <linearGradient id="bf-shield" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="hsl(0 0% 95%)" />
          <stop offset="1" stopColor="hsl(0 0% 50%)" />
        </linearGradient>
      </defs>
      <g transform="translate(100,100)">
        {[0, 14, 28].map((r, i) => (
          <circle
            key={r}
            cx="0"
            cy="0"
            r={48 + r}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity={1 - i * 0.3}
          />
        ))}
        <path
          d="M0 -38 L 28 -22 L 28 14 C 28 28 16 38 0 44 C -16 38 -28 28 -28 14 L -28 -22 Z"
          fill="url(#bf-shield)"
        />
        <path
          d="M-12 4 L -2 14 L 14 -8"
          stroke="hsl(0 0% 8%)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
