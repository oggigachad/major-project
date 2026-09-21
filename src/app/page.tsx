import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { LogoBand } from "@/components/landing/logo-band";
import { TabsSection } from "@/components/landing/tabs-section";
import { MemorySection } from "@/components/landing/memory-section";
import { Testimonials } from "@/components/landing/testimonials";
import { Features } from "@/components/landing/features";
import { McpSection } from "@/components/landing/mcp-section";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-[#f4f2ea]">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <LogoBand />
        <TabsSection />
        <MemorySection />
        <Testimonials />
        <Features />
        <McpSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
