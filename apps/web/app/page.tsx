import { Hero } from "@/components/site/Hero";
import { HowItWorks } from "@/components/site/HowItWorks";
import { BentoFeatures } from "@/components/site/BentoFeatures";
import { FeaturedProducts } from "@/components/site/FeaturedProducts";
import { CTA } from "@/components/site/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <FeaturedProducts />
      <BentoFeatures />
      <CTA />
    </>
  );
}
