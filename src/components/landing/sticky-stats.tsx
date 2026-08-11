"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";

const stats = [
  {
    big: "73%",
    label: "Less time-to-hire",
    detail:
      "From 42 days to 11 days on average across 200+ roles. Every stage of the pipeline — resume screen, aptitude, coding, interview — runs in parallel instead of sequence.",
  },
  {
    big: "4.2x",
    label: "More candidates screened",
    detail:
      "Same recruiter headcount, 4x throughput during peak hiring drives. The AI handles the volume; your team handles the judgment calls on the shortlist.",
  },
  {
    big: "96%",
    label: "Offer acceptance",
    detail:
      "Candidates who complete an AI mock interview accept at 96%. Structured feedback during the process builds trust before the offer ever lands.",
  },
  {
    big: "$0",
    label: "Enterprise license needed",
    detail:
      "Stop paying $80k a year for an ATS you outgrow in 18 months. EvalixAI starts free and scales with the roles you actually fill — not the seats you theoretically need.",
  },
];

export function StickyStats() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    const setup = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !sectionRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const cards = sectionRef.current.querySelectorAll<HTMLElement>(
        "[data-stat-card]"
      );

      ctx = gsap.context(() => {
        // Animate each card's big number characters + detail words on scroll
        cards.forEach((card) => {
          const chars = card.querySelectorAll<HTMLElement>("[data-char]");
          const words = card.querySelectorAll<HTMLElement>("[data-word]");

          gsap.set(chars, { yPercent: 60, opacity: 0 });
          gsap.set(words, { y: 16, opacity: 0 });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: card,
              start: "top 75%",
              toggleActions: "play none none none",
            },
          });

          tl.to(chars, {
            yPercent: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.03,
            ease: "power3.out",
          }).to(
            words,
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              stagger: 0.015,
              ease: "power2.out",
            },
            "-=0.4"
          );
        });

        // Left column fade-in
        const leftItems = sectionRef.current!.querySelectorAll<HTMLElement>(
          "[data-fade]"
        );
        gsap.set(leftItems, { opacity: 0, y: 20 });
        gsap.to(leftItems, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none none",
          },
        });
      }, sectionRef);
    };

    setup();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-background border-b border-border"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left — sticky */}
        <div className="lg:sticky lg:top-0 lg:h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 lg:pr-20 border-b lg:border-b-0 lg:border-r border-border">
          <div data-fade>
            <div className="text-xs font-medium uppercase tracking-wider text-primary mb-3">
              Measured outcomes
            </div>
            <h2 className="font-serif text-[40px] sm:text-5xl lg:text-[56px] leading-[1.05] tracking-[-0.025em] text-foreground text-balance">
              Numbers that compound when you stop guessing.
            </h2>
          </div>

          <div className="space-y-6 mt-10 lg:mt-0" data-fade>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md">
              Hiring on gut feel is how great companies end up with average
              teams. EvalixAI replaces intuition with instrumentation — every
              stage measured, every decision auditable, every bias visible
              before it costs you.
            </p>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md">
              The result isn&apos;t just faster hiring. It&apos;s hiring you can
              defend, replicate, and improve. Quarter over quarter.
            </p>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md">
              No enterprise contract. No six-month implementation. Just a
              pipeline that starts working the day you sign up.
            </p>
          </div>

          <div data-fade className="mt-10 lg:mt-0">
            <a
              href="#cta"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start your first pipeline
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Right — scrolling stat cards */}
        <div className="flex flex-col">
          {stats.map((s, i) => (
            <div
              key={s.label}
              data-stat-card
              className={`p-8 sm:p-12 lg:p-16 ${
                i < stats.length - 1 ? "border-b border-border" : ""
              } min-h-[50vh] lg:min-h-[45vh] flex flex-col justify-center`}
            >
              <div className="text-xs font-medium uppercase tracking-wider text-primary mb-4">
                {s.label}
              </div>
              <h3 className="font-serif text-[56px] sm:text-[80px] lg:text-[96px] leading-[0.95] tracking-[-0.04em] text-foreground mb-6 overflow-hidden">
                <span className="inline-flex">
                  {s.big.split("").map((c, ci) => (
                    <span
                      key={ci}
                      data-char
                      className="inline-block"
                      style={{ willChange: "transform, opacity" }}
                    >
                      {c === " " ? "\u00A0" : c}
                    </span>
                  ))}
                </span>
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
                {s.detail.split(" ").map((w, wi) => (
                  <span
                    key={wi}
                    data-word
                    className="inline-block"
                    style={{ willChange: "transform, opacity" }}
                  >
                    {w}
                    {wi < s.detail.split(" ").length - 1 ? "\u00A0" : ""}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
