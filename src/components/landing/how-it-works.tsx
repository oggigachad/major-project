"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Cpu,
  Trophy,
  ArrowRight,
  CheckCircle2,
  FileText,
  Code2,
  Mic,
  Trophy as TrophyIcon,
} from "lucide-react";
import { useSplitTextReveal } from "./use-gsap";

type TabKey = "source" | "screen" | "hire";

const tabs: Record<
  TabKey,
  {
    label: string;
    title: string;
    description: string;
    bullets: string[];
    icon: typeof UserPlus;
    visual: React.ReactNode;
  }
> = {
  source: {
    label: "Source",
    title: "Create a job & let candidates flow in",
    description:
      "Publish a job posting with a configurable screening pipeline. Candidates apply via your public careers page or a shareable link — EvalixAI parses every resume automatically and pulls structured data the moment they submit.",
    bullets: [
      "Public careers page or shareable link",
      "Auto-resume parsing (PDF/DOCX) on submit",
      "Duplicate-candidate detection across your org",
    ],
    icon: UserPlus,
    visual: <SourceVisual />,
  },
  screen: {
    label: "Screen",
    title: "AI evaluates every candidate consistently",
    description:
      "EvalixAI runs aptitude tests, technical MCQs, AI mock interviews, and coding assessments — all proctored, all auto-scored. Recruiters see a ranked list with composite scores, skill gaps flagged, and full audit trails.",
    bullets: [
      "Proctored aptitude + technical rounds",
      "AI mock interviews with structured feedback",
      "Sandboxed coding tests with plagiarism detection",
    ],
    icon: Cpu,
    visual: <ScreenVisual />,
  },
  hire: {
    label: "Hire",
    title: "Decide with data, not gut feel",
    description:
      "A unified candidate ranking with weighted composite scores across every stage. Your hiring team collaborates with scorecards and comments, automated notifications keep candidates warm, and analytics surface bias before it costs you a great hire.",
    bullets: [
      "Weighted composite ranking across stages",
      "Team scorecards & collaborative comments",
      "Time-to-hire, drop-off & bias analytics",
    ],
    icon: Trophy,
    visual: <HireVisual />,
  },
};

export function HowItWorks() {
  const [active, setActive] = useState<TabKey>("source");
  const headingRef = useSplitTextReveal<HTMLHeadingElement>();

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-xs font-medium uppercase tracking-wider text-primary mb-3">
          How it works
        </div>
        <h2
          ref={headingRef}
          className="font-serif text-[40px] sm:text-6xl lg:text-7xl text-foreground max-w-4xl leading-[1.02] tracking-[-0.025em] text-balance"
        >
          <span data-split>Three steps from open role to signed offer.</span>
        </h2>

        {/* Tabs */}
        <div className="mt-10 sm:mt-14">
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 border-b border-border">
            {(Object.keys(tabs) as TabKey[]).map((key) => {
              const isActive = active === key;
              const Icon = tabs[key].icon;
              return (
                <button
                  key={key}
                  onClick={() => setActive(key)}
                  className={`relative px-1 sm:px-4 pb-4 pt-2 text-left transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium">
                      {tabs[key].label}
                    </span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <h3 className="font-serif text-3xl sm:text-4xl text-foreground mb-4">
                  {tabs[active].title}
                </h3>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
                  {tabs[active].description}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {tabs[active].bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2.5 text-sm text-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <a
                  href="#cta"
                  className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
                >
                  Try it free
                  <ArrowRight className="h-4 w-4" />
                </a>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${active}-visual`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {tabs[active].visual}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function SourceVisual() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xl shadow-black/5">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
        Job posting · live
      </div>
      <div className="font-serif text-2xl text-foreground mb-1">
        Senior Frontend Engineer
      </div>
      <div className="text-xs text-muted-foreground mb-5">
        Remote · ₹35–55L · Full-time
      </div>

      <div className="rounded-xl bg-secondary/60 p-4 mb-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Required skills (parsed from JD)
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["React", "TypeScript", "Next.js", "GraphQL", "System Design", "5+ yrs"].map(
            (s) => (
              <span
                key={s}
                className="rounded-md bg-background border border-border px-2 py-0.5 text-[11px] text-foreground"
              >
                {s}
              </span>
            )
          )}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border p-4">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Pipeline
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          {["Resume", "Aptitude", "Coding", "Interview", "Offer"].map(
            (stage, i) => (
              <div key={stage} className="flex items-center gap-1">
                <div
                  className={`rounded-md px-2 py-1 ${
                    i === 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {stage}
                </div>
                {i < 4 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                )}
              </div>
            )
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        248 resumes parsed · 0 duplicates
      </div>
    </div>
  );
}

function ScreenVisual() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xl shadow-black/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="text-xs font-medium text-foreground">
            Proctored · Live · 18:24 remaining
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground">Candidate: Priya S.</div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: FileText, label: "Aptitude", score: "92%" },
          { icon: Code2, label: "Coding", score: "88%" },
          { icon: Mic, label: "Interview", score: "Pending" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-lg border border-border bg-background p-2.5 text-center"
            >
              <Icon className="h-4 w-4 mx-auto text-primary mb-1" />
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
              <div className="font-mono text-sm font-semibold text-foreground">
                {s.score}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-secondary/60 p-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Coding question · Python
        </div>
        <div className="text-xs text-foreground mb-2">
          Find the longest substring without repeating characters.
        </div>
        <pre className="font-mono text-[11px] bg-background rounded-md p-2.5 overflow-x-auto text-foreground/90">
{`def length_of_longest(s):
    seen = {}
    start = best = 0
    for i, c in enumerate(s):
        if c in seen and seen[c] >= start:
            start = seen[c] + 1
        seen[c] = i
        best = max(best, i - start + 1)
    return best`}
        </pre>
        <div className="mt-2 flex items-center gap-2 text-[10px]">
          <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-primary font-medium">
            ✓ 8/8 tests passed
          </span>
          <span className="text-muted-foreground">O(n) · 24ms</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-900">
        <span>⚠</span>
        Plagiarism check: 12% similarity to public source
      </div>
    </div>
  );
}

function HireVisual() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xl shadow-black/5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-serif text-xl text-foreground">Ranked candidates</div>
        <div className="text-[11px] text-muted-foreground">Composite score</div>
      </div>

      <div className="space-y-2">
        {[
          { name: "Priya Sharma", role: "Sr. FE @ Razorpay", score: 96, status: "Interview" },
          { name: "Aman Verma", role: "FE @ Zomato", score: 92, status: "Interview" },
          { name: "Neha Iyer", role: "Full-stack @ Stripe", score: 89, status: "Coding" },
          { name: "Karan Mehta", role: "FE @ PhonePe", score: 84, status: "Screened" },
        ].map((c, i) => (
          <div
            key={c.name}
            className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 hover:border-foreground/20 transition-colors"
          >
            <div className="font-mono text-xs text-muted-foreground w-5">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="h-8 w-8 rounded-full bg-accent/40 flex items-center justify-center font-serif text-sm text-foreground">
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{c.name}</div>
              <div className="text-xs text-muted-foreground truncate">{c.role}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-semibold text-primary">
                {c.score}
              </div>
              <div className="text-[10px] text-muted-foreground">{c.status}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Team scorecard · Priya S.
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3">
          <TrophyIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-foreground">
            &ldquo;Strong systems thinking — would extend an offer.&rdquo;
            <div className="text-muted-foreground mt-1">— Maya, Hiring Manager</div>
          </div>
        </div>
      </div>
    </div>
  );
}
