import { Hero } from "@/components/site/Hero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Features, Showcase } from "@/components/site/Features";
import { AISection } from "@/components/site/AISection";
import { CTA } from "@/components/site/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Showcase />
      <Features />
      <AISection />
      <CTA />
    </>
  );
}
