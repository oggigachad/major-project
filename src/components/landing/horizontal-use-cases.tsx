"use client";

import { useEffect, useRef } from "react";
import {
  Rocket,
  Code2,
  TrendingUp,
  GraduationCap,
  Building2,
  Briefcase,
  ArrowUpRight,
} from "lucide-react";

const useCases = [
  {
    icon: Rocket,
    role: "For Startups",
    headline: "Hire your first 10 engineers without an HR team",
    description:
      "Founders shouldn't be screening resumes at midnight. EvalixAI runs the entire pipeline — from job posting to ranked shortlist — so you can focus on closing, not filtering.",
    stat: "11d",
    statLabel: "avg time-to-hire",
    accent: "bg-accent/30",
  },
  {
    icon: Code2,
    role: "For Engineering Teams",
    headline: "Technical screening that respects engineer time",
    description:
      "Stop pulling senior engineers into 45-minute screening calls. Sandboxed coding assessments with plagiarism detection filter the noise — your team only meets the shortlist.",
    stat: "4.2x",
    statLabel: "more candidates screened",
    accent: "bg-primary/15",
  },
  {
    icon: TrendingUp,
    role: "For Sales Hiring",
    headline: "Role-play interviews that predict ramp",
    description:
      "AI mock interviews simulate real sales scenarios — objection handling, discovery, closing. Structured feedback scores communication, clarity, and conviction before you ever pick up the phone.",
    stat: "96%",
    statLabel: "offer acceptance rate",
    accent: "bg-accent/30",
  },
  {
    icon: GraduationCap,
    role: "For Campus Recruiting",
    headline: "Screen 500 candidates in a weekend",
    description:
      "Campus drives don't have to mean 14-hour days for your team. EvalixAI handles aptitude tests, coding rounds, and initial interviews at scale — with proctoring that actually works.",
    stat: "500+",
    statLabel: "candidates / drive",
    accent: "bg-primary/15",
  },
  {
    icon: Briefcase,
    role: "For Agencies",
    headline: "White-label screening for your clients",
    description:
      "Run EvalixAI under your own brand. Configurable pipelines, custom scoring rubrics, and client-branded candidate portals — without building any of it yourself.",
    stat: "3x",
    statLabel: "more placements / quarter",
    accent: "bg-accent/30",
  },
  {
    icon: Building2,
    role: "For Enterprise",
    headline: "Scale what works, retire what doesn't",
    description:
      "Already have an ATS? EvalixAI slots in as the intelligent screening layer — SSO, audit trails, custom integrations, and bias analytics that satisfy your compliance team.",
    stat: "99.9%",
    statLabel: "platform uptime SLA",
    accent: "bg-primary/15",
  },
];

export function HorizontalUseCases() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    let stInstance: { kill: () => void; refresh: () => void } | undefined;

    const setup = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !sectionRef.current || !trackRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const track = trackRef.current;
      const section = sectionRef.current;
      const isMobile = window.matchMedia("(max-width: 768px)").matches;

      // Skip pinning on mobile (cards stack vertically instead)
      if (isMobile) return;

      // Kill any previous instance on this section
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section || (st.trigger as HTMLElement)?.closest("#startups")) {
          st.kill();
        }
      });

      const getScrollDistance = () => {
        // Distance to scroll = track width - one viewport width
        // (so the last card's right edge aligns with viewport right edge)
        return Math.max(0, track.scrollWidth - window.innerWidth);
      };

      ctx = gsap.context(() => {
        const distance = getScrollDistance();
        if (distance <= 0) return;

        const tween = gsap.to(track, {
          x: () => -getScrollDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${getScrollDistance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        stInstance = tween.scrollTrigger!;
      }, sectionRef);

      // Refresh after setup to ensure correct positions
      ScrollTrigger.refresh();
    };

    // Wait for fonts to load before measuring (prevents layout shift issues)
    const init = () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          setTimeout(setup, 100);
        });
      } else {
        setTimeout(setup, 300);
      }
    };
    init();

    // Rebuild on resize (debounced)
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ctx?.revert();
        stInstance?.kill();
        setup();
      }, 250);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      stInstance?.kill();
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="startups"
      className="relative bg-background border-y border-border overflow-hidden"
    >
      {/* Heading — absolutely positioned overlay so it stays visible during pin */}
      <div className="md:absolute md:top-0 md:left-0 md:right-0 md:z-20 md:pt-10 md:px-4 sm:px-6 lg:px-8 py-10 px-4 sm:px-6 lg:px-8 bg-background pointer-events-none">
        <div className="mx-auto max-w-7xl pointer-events-auto">
          <div className="text-xs font-medium uppercase tracking-wider text-primary mb-2">
            Who it&apos;s for
          </div>
          <h2 className="font-serif text-[32px] sm:text-5xl lg:text-6xl leading-[1.02] tracking-[-0.025em] text-foreground text-balance max-w-3xl">
            Built for every team that hires.
          </h2>
        </div>
      </div>

      {/* Horizontal track (desktop) / vertical stack (mobile) */}
      <div className="md:pt-44 md:pb-0 pb-6">
        <div
          ref={trackRef}
          className="flex flex-col md:flex-row w-max md:w-max gap-0"
        >
          {useCases.map((uc, i) => {
            const Icon = uc.icon;
            return (
              <div
                key={uc.role}
                className="w-[85vw] md:w-[34vw] lg:w-[30vw] shrink-0 border-b md:border-b-0 md:border-r border-border bg-card p-8 sm:p-10 lg:p-12 flex flex-col justify-between min-h-[60vh] md:min-h-[56vh] group hover:bg-secondary/30 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${uc.accent} text-foreground`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, "0")} / {String(useCases.length).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="text-xs font-medium uppercase tracking-wider text-primary mb-3">
                    {uc.role}
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-foreground leading-[1.1] tracking-[-0.015em] mb-5 text-balance">
                    {uc.headline}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {uc.description}
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-border flex items-end justify-between">
                  <div>
                    <div className="font-serif text-4xl sm:text-5xl text-foreground leading-none">
                      {uc.stat}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5">
                      {uc.statLabel}
                    </div>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
          {/* End card */}
          <div className="w-[85vw] md:w-[34vw] lg:w-[30vw] shrink-0 bg-foreground text-background p-8 sm:p-10 lg:p-12 flex flex-col justify-center min-h-[60vh] md:min-h-[56vh]">
            <h3 className="font-serif text-3xl sm:text-4xl leading-tight mb-4 text-balance">
              Not sure where you fit?
            </h3>
            <p className="text-sm text-background/70 leading-relaxed mb-6">
              Tell us about your team and we&apos;ll show you the exact pipeline
              configuration that works for your hiring rhythm.
            </p>
            <a
              href="#cta"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent/90 transition-colors w-fit"
            >
              Talk to us
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
