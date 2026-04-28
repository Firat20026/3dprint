import { Hero } from "@/components/site/Hero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Features } from "@/components/site/Features";
import { TrendingDesigns } from "@/components/site/TrendingDesigns";
import { AISection } from "@/components/site/AISection";
import { CTA } from "@/components/site/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <TrendingDesigns />
      <Features />
      <AISection />
      <CTA />
    </>
  );
}
