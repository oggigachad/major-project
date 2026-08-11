"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useSplitTextReveal } from "./use-gsap";

export function FinalCTA() {
  const headingRef = useSplitTextReveal<HTMLHeadingElement>({
    stagger: 0.05,
    duration: 1,
  });

  return (
    <section id="cta" className="py-20 sm:py-28 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-border bg-card overflow-hidden noise">
          {/* Decorative background */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 20%, rgba(200,240,74,0.3) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(26,58,46,0.15) 0%, transparent 45%)",
            }}
          />

          <div className="relative px-6 py-16 sm:px-12 sm:py-20 lg:py-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 backdrop-blur px-3 py-1 text-xs text-foreground/80 mb-8"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Free for up to 50 candidates / month
            </motion.div>

            <h2
              ref={headingRef}
              className="font-serif text-[44px] sm:text-[72px] lg:text-[96px] leading-[0.95] tracking-[-0.03em] text-foreground text-balance mx-auto max-w-3xl"
            >
              <span data-split>Unlimited hiring intelligence.</span>
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto"
            >
              Start your first job posting in under five minutes. No credit
              card, no implementation cycle, no bot in the room.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Start hiring free
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-7 py-3.5 text-sm font-medium text-foreground hover:border-foreground/30 transition-colors"
              >
                View pricing
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
            >
              <span>No credit card required</span>
              <span className="hidden sm:inline">·</span>
              <span>Cancel anytime</span>
              <span className="hidden sm:inline">·</span>
              <span>SOC 2 ready · GDPR compliant</span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
