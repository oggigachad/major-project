import { ScrollProgress } from "@/components/landing/scroll-progress";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { LogosMarquee } from "@/components/landing/logos-marquee";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { HorizontalUseCases } from "@/components/landing/horizontal-use-cases";
import { Manifesto } from "@/components/landing/manifesto";
import { HighlightSections } from "@/components/landing/highlight-sections";
import { StickyStats } from "@/components/landing/sticky-stats";
import { PipelineFunnel } from "@/components/landing/pipeline-funnel";
import { SecuritySection } from "@/components/landing/security";
import { FinalCTA } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <ScrollProgress />
      <Navbar />
      <Hero />
      <LogosMarquee />
      <FeatureGrid />
      <HowItWorks />
      <HorizontalUseCases />
      <Manifesto />
      <HighlightSections />
      <StickyStats />
      <PipelineFunnel />
      <SecuritySection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
