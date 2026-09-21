"use client";

import { useEffect, useRef } from "react";
import { useSplitTextReveal } from "./use-gsap";

const stages = [
  { name: "Applied", count: 248, pct: 100, color: "bg-secondary-foreground/15", textColor: "text-foreground" },
  { name: "Resume screened", count: 124, pct: 50, color: "bg-primary/30", textColor: "text-foreground" },
  { name: "Aptitude passed", count: 68, pct: 27, color: "bg-primary/50", textColor: "text-foreground" },
  { name: "Coding round", count: 32, pct: 13, color: "bg-primary/70", textColor: "text-primary-foreground" },
  { name: "Mock interview", count: 18, pct: 7, color: "bg-primary/85", textColor: "text-primary-foreground" },
  { name: "Offer extended", count: 6, pct: 2.4, color: "bg-primary", textColor: "text-primary-foreground" },
];

export function PipelineFunnel() {
  const headingRef = useSplitTextReveal<HTMLHeadingElement>();
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !barsRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const bars = barsRef.current.querySelectorAll<HTMLElement>("[data-bar]");
      gsap.set(bars, { scaleX: 0, transformOrigin: "left center" });

      ctx = gsap.context(() => {
        gsap.to(bars, {
          scaleX: 1,
          duration: 1.2,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: barsRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        });
      }, barsRef);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section id="analytics" className="py-20 sm:py-28 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-primary mb-3">
              Pipeline analytics
            </div>
            <h2
              ref={headingRef}
              className="font-serif text-[40px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.025em] text-foreground text-balance"
            >
              <span data-split>See your funnel the moment it shifts.</span>
            </h2>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
              Every stage of your hiring pipeline, measured. Drop-off rates,
              time-to-hire, source-of-hire, and bias indicators — surfaced
              before they cost you a great candidate.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="font-serif text-3xl text-foreground">11d</div>
                <div className="text-xs text-muted-foreground mt-1">
                  avg time-to-hire
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="font-serif text-3xl text-foreground">2.4%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  application → offer
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="font-serif text-3xl text-foreground">38%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  resume → screening
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="font-serif text-3xl text-foreground">0</div>
                <div className="text-xs text-muted-foreground mt-1">
                  bias indicators flagged
                </div>
              </div>
            </div>
          </div>

          <div ref={barsRef} className="space-y-3">
            {stages.map((s) => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="font-mono text-muted-foreground">
                    {s.count}{" "}
                    <span className="text-xs">({s.pct}%)</span>
                  </span>
                </div>
                <div className="h-10 rounded-lg bg-card border border-border overflow-hidden">
                  <div
                    data-bar
                    className={`h-full ${s.color} ${s.textColor} rounded-lg flex items-center justify-end px-3`}
                  >
                    <span className="font-mono text-xs font-medium">
                      {s.count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-2 text-xs text-muted-foreground">
              Live funnel · Senior Frontend Engineer · last 30 days
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
