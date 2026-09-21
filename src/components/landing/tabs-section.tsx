"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanText,
  ListChecks,
  MessageSquare,
  Check,
  Circle,
  Sparkles,
  Bell,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Kicker, EASE, Counter, ScoreBar } from "./shared";

type Phase = "screening" | "assessments" | "interviews";

const PHASES: {
  id: Phase;
  label: string;
  title: string;
  body: string;
}[] = [
  {
    id: "screening",
    label: "Screening",
    title: "Wake up to a shortlist",
    body: "EvalixAI screens your entire applicant pool overnight and surfaces the people who actually fit — with the reasons why, not just keyword hits.",
  },
  {
    id: "assessments",
    label: "Assessments",
    title: "Skills tested, automatically",
    body: "Send aptitude and technical assessments in one click. Every submission is auto-scored, so you compare candidates on evidence from day one.",
  },
  {
    id: "interviews",
    label: "Interviews",
    title: "Interview feedback, ready",
    body: "Every shortlisted candidate gets a consistent AI mock interview with detailed feedback — hours before you or your team ever joins a call.",
  },
];

function PhaseCard({ phase }: { phase: Phase }) {
  if (phase === "screening") {
    return (
      <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-[0_16px_40px_-16px_rgba(29,27,21,0.18)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-[#dde0b8] text-[#4a5327]">
              <ScanText className="size-4.5" />
            </span>
            <div>
              <p className="text-[14px] font-semibold text-[#1d1b15]">
                Senior Frontend Engineer
              </p>
              <p className="text-[12px] text-[#8a8578]">
                128 applicants · screened overnight
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[#1d1b15] px-2.5 py-1 text-[11px] font-medium text-[#f4f2ea]">
            <Bell className="size-3" /> 9 top matches
          </span>
        </div>
        <div className="mt-4 space-y-3 rounded-xl bg-[#faf8f0] p-4">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8a8578]">
            <Sparkles className="size-3.5 text-[#6f7c3d]" /> Screening brief
          </p>
          <p className="text-[13.5px] leading-relaxed text-[#33302a]">
            EvalixAI read all 128 resumes and found 9 candidates matching your
            must-haves — React, TypeScript, 6+ years. Maya Chen also led a
            design-system team at Loopwork and may suit the staff-level scope.
          </p>
          <p className="text-[13.5px] leading-relaxed text-[#33302a]">
            Suggested next step: invite the top 9 to the technical assessment.
          </p>
          <div className="grid grid-cols-3 gap-2 border-t border-[#e5e2d2] pt-3">
            {[
              { value: 128, label: "screened" },
              { value: 9, label: "matched" },
              { value: 2, label: "flagged" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-serif-display text-[22px] font-medium leading-none text-[#1d1b15]">
                  <Counter to={s.value} />
                </p>
                <p className="mt-1 text-[11px] text-[#8a8578]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "assessments") {
    return (
      <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-[0_16px_40px_-16px_rgba(29,27,21,0.18)] sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-[#dde0b8] text-[#4a5327]">
              <ListChecks className="size-4.5" />
            </span>
            <p className="text-[14px] font-semibold text-[#1d1b15]">
              Technical assessment — live
            </p>
          </div>
          <span className="nota-pulse flex items-center gap-1.5 rounded-full bg-[#1d1b15] px-2.5 py-1 text-[11px] font-medium text-[#f4f2ea]">
            <span className="size-1.5 rounded-full bg-[#e08572]" />
            Auto-scoring
          </span>
        </div>
        <div className="mt-4 space-y-4 rounded-xl border border-dashed border-[#d9d5c3] bg-[#faf8f0] p-4">
          {[
            { label: "Aptitude", value: 87, delay: 0.1 },
            { label: "Problem solving", value: 78, delay: 0.25 },
            { label: "Communication", value: 84, delay: 0.4 },
          ].map((row) => (
            <div key={row.label}>
              <div className="flex items-baseline justify-between">
                <p className="text-[13px] font-medium text-[#33302a]">
                  {row.label}
                </p>
                <p className="text-[13px] font-semibold tabular-nums text-[#6f7c3d]">
                  {row.value}
                  <span className="text-[11px] font-normal text-[#8a8578]">
                    /100
                  </span>
                </p>
              </div>
              <ScoreBar value={row.value} delay={row.delay} className="mt-1.5" />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-[#f0f2e0] p-4">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-[#6f7c3d]" />
          <p className="text-[13px] leading-relaxed text-[#4a5327]">
            Scores appear the moment candidates submit — no grading, no
            spreadsheets, no waiting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-[0_16px_40px_-16px_rgba(29,27,21,0.18)] sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-[#dde0b8] text-[#4a5327]">
            <MessageSquare className="size-4.5" />
          </span>
          <p className="text-[14px] font-semibold text-[#1d1b15]">
            AI interview — Maya Chen
          </p>
        </div>
        <span className="rounded-full bg-[#dde0b8] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#4a5327]">
          Feedback ready
        </span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {[
          "Explains architectural trade-offs clearly",
          "Strong system-design instincts",
          "Codes fluently under time pressure",
        ].map((line) => (
          <li key={line} className="flex gap-2.5 text-[13.5px] text-[#33302a]">
            <Check className="mt-[3px] size-4 shrink-0 text-[#6f7c3d]" />
            {line}
          </li>
        ))}
        <li className="flex gap-2.5 text-[13.5px] text-[#33302a]">
          <Circle className="mt-[3px] size-4 shrink-0 text-[#c9c4b2]" />
          Probe next: ownership of cross-team work
        </li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e2d2] px-3 py-1.5 text-[12.5px] font-medium text-[#1d1b15] transition-colors hover:border-[#1d1b15]/30">
          Generate report <ArrowRight className="size-3.5" />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e2d2] px-3 py-1.5 text-[12.5px] font-medium text-[#1d1b15] transition-colors hover:border-[#1d1b15]/30">
          Advance to offer <ArrowRight className="size-3.5" />
        </span>
      </div>
    </div>
  );
}

export function TabsSection() {
  const [active, setActive] = useState<Phase>("screening");
  const current = PHASES.find((p) => p.id === active)!;

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left: heading + tabs */}
        <div>
          <Kicker>Hiring flow</Kicker>
          <h2 className="font-serif-display mt-3 text-balance text-[34px] font-medium leading-[1.08] tracking-[-0.015em] text-[#1d1b15] sm:text-[46px]">
            EvalixAI helps you screen, assess and interview every candidate.
          </h2>

          <div
            role="tablist"
            aria-label="Hiring pipeline stages"
            className="mt-8 flex flex-wrap gap-2"
          >
            {PHASES.map((phase) => (
              <button
                key={phase.id}
                role="tab"
                aria-selected={active === phase.id}
                onClick={() => setActive(phase.id)}
                className={cn(
                  "relative h-10 rounded-full px-4 text-[14px] font-medium transition-colors duration-200",
                  active === phase.id
                    ? "text-[#f4f2ea]"
                    : "text-[#55524a] ring-1 ring-[#e5e2d2] hover:ring-[#1d1b15]/25"
                )}
              >
                {active === phase.id && (
                  <motion.span
                    layoutId="phase-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-[#1d1b15] shadow-[0_6px_18px_rgba(29,27,21,0.22)]"
                  />
                )}
                <span className="relative z-10">{phase.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.32, ease: EASE }}
              className="mt-7 max-w-lg"
            >
              <h3 className="font-serif-display text-[22px] font-medium text-[#1d1b15]">
                {current.title}
              </h3>
              <p className="mt-2.5 text-[16px] leading-relaxed text-[#55524a]">
                {current.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: animated phase card */}
        <div className="relative">
          <div
            className="nota-warm-glow pointer-events-none absolute -inset-10 rounded-full opacity-70"
            aria-hidden
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 22, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -22, scale: 0.97 }}
              transition={{ duration: 0.38, ease: EASE }}
              className="relative"
            >
              <PhaseCard phase={active} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
