"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { useSplitTextReveal } from "./use-gsap";
import { useCountUp } from "./use-count-up";

export function HighlightSections() {
  const headingRef = useSplitTextReveal<HTMLHeadingElement>({
    stagger: 0.05,
    duration: 1,
  });

  return (
    <>
      {/* Accent green section — Perfect hiring memory */}
      <section className="py-24 sm:py-36 bg-accent text-foreground overflow-hidden relative">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(26,58,46,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(26,58,46,0.1) 0%, transparent 50%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2
            ref={headingRef}
            className="font-serif text-center text-[56px] sm:text-[100px] lg:text-[140px] leading-[0.9] tracking-[-0.04em] text-balance"
          >
            <span data-split>Perfect hiring memory.</span>
          </h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 text-center text-base sm:text-lg text-foreground/70 max-w-xl mx-auto"
          >
            Every candidate, every scorecard, every decision — searchable,
            auditable, and never forgotten. Bias-resistant by design.
          </motion.p>
        </div>
      </section>

      {/* Dark section — Analytics + testimonials */}
      <section className="py-24 sm:py-36 bg-foreground text-background overflow-hidden relative">
        <div aria-hidden="true" className="absolute inset-0 bg-grid-dark opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-[64px] leading-[1.05] tracking-[-0.02em] text-balance">
                Helping small teams hire like big ones
              </h2>
              <p className="mt-6 text-base sm:text-lg text-background/70 leading-relaxed max-w-lg">
                When you&apos;re a 12-person startup, every hire matters. EvalixAI
                gives you the screening rigor of an enterprise ATS — without
                the enterprise price, the bot-stuffed calls, or the six-month
                implementation.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-6 max-w-md">
                <Stat value={73} suffix="%" label="less time-to-hire" />
                <Stat value={4} suffix="x" label="more candidates screened" />
                <Stat value={99.9} decimals={1} suffix="%" label="platform uptime" />
                <Stat value={5} suffix="k+" label="interviews / month" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.1 }}
                  className="rounded-2xl border border-background/15 bg-background/[0.04] p-5 sm:p-6 backdrop-blur hover:bg-background/[0.07] transition-colors"
                >
                  <Quote className="h-5 w-5 text-accent mb-3" />
                  <p className="text-sm sm:text-base text-background/90 leading-relaxed">
                    {t.quote}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-accent/40 flex items-center justify-center font-serif text-sm text-foreground">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-background">
                        {t.name}
                      </div>
                      <div className="text-xs text-background/60">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({
  value,
  decimals = 0,
  suffix = "",
  label,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  label: string;
}) {
  const { ref, value: display } = useCountUp(value, { decimals });
  return (
    <div>
      <div className="font-serif text-4xl text-background">
        <span ref={ref}>{display}</span>
        <span className="text-accent">{suffix}</span>
      </div>
      <div className="text-xs text-background/60 mt-1">{label}</div>
    </div>
  );
}

const testimonials = [
  {
    quote:
      "We replaced three spreadsheets and a shared doc with EvalixAI. Our first hire closed in 11 days — half our usual time.",
    name: "Maya Chen",
    role: "Founder, Lattice Labs",
  },
  {
    quote:
      "The AI mock interview feature alone is worth it. Candidates actually thank us for the structured feedback.",
    name: "Devon Pierce",
    role: "Head of Talent, Sequel Ventures",
  },
  {
    quote:
      "I stopped second-guessing hiring decisions. The composite score and bias indicators surface things I'd never catch manually.",
    name: "Priya Shah",
    role: "Engineering Manager, Plaid",
  },
];
