"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { EvalixLogo } from "./evalix-logo";

export function Hero() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const subCopyRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !headlineRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      // Animate words upward with stagger on load
      const words = headlineRef.current.querySelectorAll<HTMLElement>(".word");
      gsap.set(words, { yPercent: 110, opacity: 0 });

      ctx = gsap.context(() => {
        gsap.to(words, {
          yPercent: 0,
          opacity: 1,
          duration: 1.1,
          stagger: 0.06,
          ease: "power4.out",
          delay: 0.15,
        });

        // Scroll-driven parallax: mockup drifts up slightly, sub-copy fades
        if (mockupRef.current && sectionRef.current) {
          gsap.to(mockupRef.current, {
            yPercent: -8,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
          });
        }
        if (subCopyRef.current) {
          gsap.to(subCopyRef.current, {
            opacity: 0,
            y: -20,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "40% top",
              scrub: 1,
            },
          });
        }
      }, sectionRef);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 overflow-hidden">
      {/* Background grid + glow */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] rounded-full bg-accent/20 blur-3xl opacity-50" />
        <div className="absolute top-40 right-10 w-[400px] h-[400px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center mb-8"
        >
          <a
            href="#interviews"
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-4 py-1.5 text-xs sm:text-sm text-foreground/80 hover:border-foreground/30 transition-colors"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/30 px-2 py-0.5 text-[10px] sm:text-xs font-medium uppercase tracking-wide text-foreground">
              <Sparkles className="h-3 w-3" />
              New
            </span>
            <span>AI Mock Interviews with structured feedback</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </motion.div>

        {/* Headline — GSAP word-by-word reveal */}
        <h1
          ref={headlineRef}
          className="font-serif text-center text-[44px] leading-[1.02] tracking-[-0.025em] text-foreground sm:text-6xl md:text-7xl lg:text-[92px] text-balance"
        >
          <span className="block overflow-hidden">
            <span className="word inline-block">The</span>{" "}
            <span className="word inline-block">AI</span>{" "}
            <span className="word inline-block">hiring</span>{" "}
            <span className="word inline-block">pipeline</span>
          </span>
          <span className="block overflow-hidden">
            <span className="word inline-block">for</span>{" "}
            <span className="word inline-block italic text-primary">startups</span>
            <span className="word inline-block">.</span>
          </span>
        </h1>

        {/* Sub copy */}
        <motion.p
          ref={subCopyRef}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-6 max-w-2xl text-center text-base sm:text-lg text-muted-foreground text-pretty"
        >
          EvalixAI automates resume screening, aptitude tests, AI mock
          interviews, coding assessments, and candidate ranking — so your
          small team can hire like an enterprise without the enterprise cost.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <a
            href="#cta"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            Start hiring free
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 backdrop-blur px-7 py-3.5 text-sm font-medium text-foreground hover:border-foreground/30 transition-colors"
          >
            See how it works
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-4 text-center text-xs text-muted-foreground"
        >
          Free for up to 50 candidates / month · No credit card required
        </motion.p>

        {/* Product visual */}
        <motion.div
          ref={mockupRef}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-16 sm:mt-20"
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-6xl">
      {/* Browser chrome frame */}
      <div className="relative rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <div className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md bg-background px-3 py-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-primary" />
            app.evalixai.com/jobs/senior-frontend-engineer
          </div>
          <div className="w-12" />
        </div>

        {/* Body: dashboard layout */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-[520px]">
          {/* Sidebar */}
          <aside className="hidden md:flex flex-col border-r border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-2 mb-5">
              <EvalixLogo className="h-6 w-6 text-foreground" />
              <span className="font-serif text-lg">EvalixAI</span>
            </div>
            <nav className="space-y-1 text-sm">
              <a className="flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1.5 text-foreground font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Pipeline
              </a>
              {["Candidates", "Jobs", "Analytics", "Settings"].map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  {s}
                </div>
              ))}
            </nav>
            <div className="mt-auto rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              <div className="font-medium text-foreground mb-0.5">Free plan</div>
              32 / 50 candidates
            </div>
          </aside>

          {/* Main content */}
          <div className="p-5 sm:p-7">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-muted-foreground">
                Job · Senior Frontend Engineer
              </div>
              <div className="rounded-full bg-accent/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                Active
              </div>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-foreground mb-4">
              Candidate pipeline
            </h3>

            {/* Funnel */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[
                { stage: "Applied", n: 248, w: "100%", color: "bg-secondary" },
                { stage: "Screened", n: 86, w: "65%", color: "bg-primary/30" },
                { stage: "Interview", n: 24, w: "35%", color: "bg-primary/60" },
                { stage: "Offer", n: 6, w: "15%", color: "bg-primary" },
              ].map((s) => (
                <div key={s.stage} className="space-y-1">
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-muted-foreground">{s.stage}</span>
                    <span className="font-mono font-medium text-foreground">
                      {s.n}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full ${s.color} rounded-full`}
                      style={{ width: s.w }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Candidate list */}
            <div className="space-y-2">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Top candidates — ranked by AI composite score
              </div>
              {[
                { name: "Priya Sharma", role: "Sr. FE @ Razorpay", score: 96, skills: ["React", "TS", "System Design"] },
                { name: "Aman Verma", role: "FE @ Zomato", score: 92, skills: ["React", "GraphQL", "Perf"] },
                { name: "Neha Iyer", role: "Full-stack @ Stripe", score: 89, skills: ["Next.js", "Node", "AWS"] },
              ].map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 hover:border-foreground/20 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-accent/40 flex items-center justify-center font-serif text-sm text-foreground">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {c.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.role}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1">
                    {c.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-foreground/70"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold text-primary">
                      {c.score}
                    </div>
                    <div className="text-[9px] text-muted-foreground">SCORE</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating score card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:block absolute -right-6 top-32 w-72 rounded-2xl border border-border bg-card p-4 shadow-xl shadow-black/10"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-full bg-accent/40 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-foreground" />
          </div>
          <div className="text-xs font-medium text-foreground">
            AI Resume Match
          </div>
          <div className="ml-auto font-mono text-sm font-semibold text-primary">
            96%
          </div>
        </div>
        <div className="space-y-1.5 text-xs">
          {[
            { label: "Skills match", val: 98, color: "bg-primary" },
            { label: "Experience", val: 92, color: "bg-primary/70" },
            { label: "Culture fit", val: 88, color: "bg-primary/50" },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-2">
              <span className="w-20 text-muted-foreground">{r.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full ${r.color} rounded-full`}
                  style={{ width: `${r.val}%` }}
                />
              </div>
              <span className="font-mono text-foreground w-8 text-right">
                {r.val}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border text-[10px] text-muted-foreground">
          ⚠ 1 missing skill flagged: <span className="text-foreground">WebGL</span>
        </div>
      </motion.div>

      {/* Floating interview card (bottom-left) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:block absolute -left-6 -bottom-8 w-64 rounded-2xl border border-border bg-card p-3.5 shadow-xl shadow-black/10"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <div className="text-xs font-medium text-foreground">
            Mock interview live
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          &ldquo;Tell me about a time you debugged a production incident.&rdquo;
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <div className="h-4 w-4 rounded-full bg-accent/40 flex items-center justify-center text-[8px] text-foreground font-medium">
            P
          </div>
          Priya S. · 03:24 / 30:00
        </div>
      </motion.div>
    </div>
  );
}
