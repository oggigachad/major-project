"use client";

import { motion } from "framer-motion";
import {
  ScanText,
  ListChecks,
  MessageSquare,
  Code2,
  BarChart3,
  Check,
  ChevronDown,
  Sparkles,
  Play,
} from "lucide-react";
import { DarkButton, PrimaryButton, ScoreBar, Counter, EASE } from "./shared";

/* ------------------------------------------------------------------ */
/* Small reusable visual mockups for each feature row                  */
/* ------------------------------------------------------------------ */

function ScreeningVisual() {
  return (
    <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-[0_18px_44px_-18px_rgba(29,27,21,0.2)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="size-9 rounded-full bg-[#e6e2cd]" />
          <div>
            <p className="text-[14px] font-semibold text-[#1d1b15]">
              Maya Chen
            </p>
            <p className="text-[12px] text-[#8a8578]">
              Senior Frontend Engineer · ex-Loopwork
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#dde0b8] px-2.5 py-1 text-[12px] font-semibold text-[#3f4821]">
          92% match
        </span>
      </div>
      <ScoreBar value={92} className="mt-4" />
      <div className="mt-4 flex flex-wrap gap-2">
        {["React", "TypeScript", "Design systems", "Team lead"].map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-[#e5e2d2] bg-[#f0f2e0] px-3 py-1 text-[12.5px] font-medium text-[#4a5327]"
          >
            {skill}
          </span>
        ))}
      </div>
      <p className="mt-4 flex items-start gap-2 rounded-lg bg-[#faf8f0] px-3.5 py-2.5 text-[13px] text-[#55524a]">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#6f7c3d]" />
        “Led a 4-person design-system team; shipped a component library used by
        40 engineers.”
      </p>
    </div>
  );
}

function AssessmentsVisual() {
  const tests = [
    "Aptitude",
    "Logical reasoning",
    "JavaScript",
    "System design",
    "Culture fit",
  ];
  return (
    <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-[0_18px_44px_-18px_rgba(29,27,21,0.2)] sm:p-6">
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8a8578]">
        Assessment library
      </p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {tests.map((test) => (
          <span
            key={test}
            className="inline-flex items-center gap-2 rounded-full border border-[#e5e2d2] bg-[#faf8f0] px-3.5 py-2 text-[13.5px] font-medium text-[#33302a]"
          >
            <span className="size-2 rounded-full bg-[#6f7c3d]" />
            {test}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-[#1d1b15] px-4 py-3">
        <span className="nota-pulse size-2 rounded-full bg-[#e08572]" />
        <p className="text-[13px] text-[#f4f2ea]">
          Auto-scoring 24 candidates right now
        </p>
      </div>
    </div>
  );
}

function InterviewVisual() {
  return (
    <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-[0_18px_44px_-18px_rgba(29,27,21,0.2)] sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold text-[#1d1b15]">
          AI interview — Maya Chen
        </p>
        <span className="rounded-full bg-[#1d1b15] px-2.5 py-1 text-[11px] font-semibold text-[#f4f2ea]">
          88/100
        </span>
      </div>
      <p className="mt-3.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8a8578]">
        Strengths
      </p>
      <ul className="mt-2.5 space-y-2">
        {[
          "Explains trade-offs clearly",
          "Strong system-design instincts",
          "Coded fluently under time pressure",
        ].map((s) => (
          <li
            key={s}
            className="flex items-center justify-between rounded-lg border border-[#eeece1] bg-[#faf8f0] px-3.5 py-2.5 text-[14px] text-[#33302a]"
          >
            {s}
            <Check className="size-4 text-[#6f7c3d]" />
          </li>
        ))}
      </ul>
      <p className="mt-3.5 text-[13px] text-[#8a8578]">
        Structured feedback you can compare across every candidate.
      </p>
    </div>
  );
}

function SandboxVisual() {
  return (
    <div className="rounded-2xl border border-[#e5e2d2] bg-[#1c1a14] p-5 shadow-[0_18px_44px_-18px_rgba(29,27,21,0.35)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#e08572]" />
          <span className="size-2.5 rounded-full bg-[#e6c069]" />
          <span className="size-2.5 rounded-full bg-[#a3bf7a]" />
        </div>
        <span className="rounded-full bg-[#dde0b8] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#3f4821]">
          Tests 6/6
        </span>
      </div>
      <div className="mt-4 space-y-1.5 rounded-lg bg-[#26241d] p-4 font-mono text-[12px] leading-relaxed">
        <p className="text-[#8a8578]">{"// candidate submission"}</p>
        <p>
          <span className="text-[#a3bf7a]">function</span>{" "}
          <span className="text-[#e6c069]">rankMatches</span>
          <span className="text-[#ece9dd]">(candidates) {"{"}</span>
        </p>
        <p className="pl-4">
          <span className="text-[#a3bf7a]">return</span>{" "}
          <span className="text-[#ece9dd]">candidates</span>
        </p>
        <p className="pl-8">
          <span className="text-[#ece9dd]">.sort((a, b) =&gt; b.score - a.score)</span>
        </p>
        <p className="pl-4">
          <span className="text-[#ece9dd]">.filter(c =&gt; c.matched);</span>
        </p>
        <p>
          <span className="text-[#ece9dd]">{"}"}</span>
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6f7c3d] px-3 py-1.5 text-[12px] font-medium text-white">
          <Play className="size-3" /> Run tests
        </span>
        <span className="text-[12px] text-[#8a8578]">
          Passed in 1.2s · auto-graded
        </span>
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  return (
    <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-[0_18px_44px_-18px_rgba(29,27,21,0.2)] sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold text-[#1d1b15]">
          Senior Frontend Engineer
        </p>
        <span className="rounded-full bg-[#dde0b8] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#4a5327]">
          Live
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { value: 128, label: "screened" },
          { value: 9, label: "shortlisted" },
          { value: 3, label: "offers" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[#eeece1] bg-[#faf8f0] px-2 py-3 text-center"
          >
            <p className="font-serif-display text-[24px] font-medium leading-none text-[#1d1b15]">
              <Counter to={s.value} />
            </p>
            <p className="mt-1 text-[11px] text-[#8a8578]">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-medium text-[#33302a]">
            Pipeline match quality
          </p>
          <p className="text-[13px] font-semibold tabular-nums text-[#6f7c3d]">
            91%
          </p>
        </div>
        <ScoreBar value={91} delay={0.2} className="mt-1.5" />
      </div>
      <p className="mt-4 text-center text-[12.5px] text-[#8a8578]">
        Every screening, assessment and interview feeds one ranked score
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feature rows                                                        */
/* ------------------------------------------------------------------ */

const ROWS = [
  {
    id: "features",
    icon: ScanText,
    kicker: "AI screening",
    title: "Beyond keyword matching",
    body: "EvalixAI reads the whole resume — context, outcomes, trajectory — then ranks candidates against your actual requirements. No more great people lost to a missing buzzword.",
    visual: <ScreeningVisual />,
  },
  {
    id: "assessments",
    icon: ListChecks,
    kicker: "Assessments",
    title: "Assessments that run themselves",
    body: "Aptitude, technical and role-specific tests, auto-scored the moment candidates submit. You see results — not spreadsheets.",
    visual: <AssessmentsVisual />,
  },
  {
    id: "interviews",
    icon: MessageSquare,
    kicker: "AI interviews",
    title: "Interviews without the calendar Tetris",
    body: "Every candidate gets a consistent AI mock interview with detailed, structured feedback you can actually compare. You talk to the shortlist — not everyone.",
    visual: <InterviewVisual />,
  },
  {
    id: "sandbox",
    icon: Code2,
    kicker: "Coding sandbox",
    title: "Coding ability, evaluated properly",
    body: "Intelligent sandboxed assessments watch how candidates think — not just what they paste. Auto-graded test runs, hidden edge cases and a clean editor they already know.",
    visual: <SandboxVisual />,
    reverse: true,
  },
  {
    id: "analytics",
    icon: BarChart3,
    kicker: "Analytics",
    title: "Ranking backed by data",
    body: "Every screening, assessment and interview feeds one score. EvalixAI shows you why each candidate ranks where they do — so decisions are fast, fair and easy to defend.",
    visual: <AnalyticsVisual />,
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: EASE }}
        className="mx-auto mb-16 max-w-3xl text-center"
      >
        <h2 className="font-serif-display text-balance text-[34px] font-medium leading-[1.08] tracking-[-0.015em] text-[#1d1b15] sm:text-[46px]">
          Works everywhere you hire, however you hire.
        </h2>
        <div className="mt-7">
          <PrimaryButton href="/signup">
            Start screening free
            <ChevronDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" />
          </PrimaryButton>
        </div>
      </motion.div>

      <div className="divide-y divide-[#e5e2d2]">
        {ROWS.map((row) => (
          <motion.div
            key={row.title}
            id={row.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className={`grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-2 lg:gap-16 ${
              row.reverse ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <motion.div
              initial={{ opacity: 0, x: row.reverse ? 28 : -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.75, ease: EASE }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-[#1d1b15] px-3 py-1.5 text-[12px] font-medium text-[#f4f2ea]">
                <row.icon className="size-3.5" />
                {row.kicker}
              </span>
              <h3 className="font-serif-display mt-4 text-[26px] font-medium leading-tight tracking-[-0.01em] text-[#1d1b15] sm:text-[30px]">
                {row.title}
              </h3>
              <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-[#55524a]">
                {row.body}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: row.reverse ? -28 : 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.75, ease: EASE }}
              className="relative"
            >
              <div
                className="nota-warm-glow pointer-events-none absolute -inset-8 opacity-60"
                aria-hidden
              />
              <motion.div
                whileHover={{ scale: 1.02, y: -3 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative"
              >
                {row.visual}
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div className="pt-10 text-center lg:hidden">
        <DarkButton>Start screening free</DarkButton>
      </div>
    </section>
  );
}
