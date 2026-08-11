"use client";

import { motion } from "framer-motion";
import { useGsapReveal, useSplitTextReveal } from "./use-gsap";
import {
  FileScan,
  ClipboardCheck,
  Mic,
  Code2,
  Trophy,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const pillars = [
  {
    n: "01",
    title: "AI-Powered Resume Screening",
    description:
      "Upload a job description and EvalixAI parses every PDF/DOCX resume, extracts structured fields, and scores each candidate against your requirements using NLP-based semantic matching via Qdrant vector search.",
    icon: FileScan,
    bullets: ["PDF & DOCX parsing", "Semantic relevance scoring", "Skill-gap flagging"],
    size: "lg",
  },
  {
    n: "02",
    title: "Automated Aptitude & Technical Screening",
    description:
      "Configurable MCQ, multiple-select, short-answer, and coding rounds with auto-scoring, randomized question order, and integrated proctoring.",
    icon: ClipboardCheck,
    bullets: ["MCQ + subjective", "AI-assisted grading", "Tab-switch detection"],
    size: "sm",
  },
  {
    n: "03",
    title: "AI-Based Mock Interviews",
    description:
      "Role-specific questions via text, audio, or video. EvalixAI evaluates relevance, clarity, and technical accuracy, then generates a structured feedback report with a readiness score.",
    icon: Mic,
    bullets: ["JD-specific questions", "Multi-modal (text/voice/video)", "Readiness scoring"],
    size: "sm",
  },
  {
    n: "04",
    title: "Coding Assessments",
    description:
      "In-browser code editor supporting Python, Java, C++, JavaScript. Sandboxed Judge0 execution with test cases, static analysis, time/memory limits, and plagiarism detection.",
    icon: Code2,
    bullets: ["Multi-language sandbox", "Correctness + quality eval", "Plagiarism detection"],
    size: "sm",
  },
  {
    n: "05",
    title: "Candidate Ranking & Analytics",
    description:
      "Weighted composite scores across all stages. Pipeline funnel metrics, time-to-hire, drop-off rate, and source-of-hire analytics — exported as CSV or PDF.",
    icon: Trophy,
    bullets: ["Weighted composite scores", "Funnel & drop-off analytics", "Bias indicators"],
    size: "sm",
  },
  {
    n: "06",
    title: "End-to-End Recruitment Workflow",
    description:
      "Create job postings, configure screening pipelines, automate stage transitions, send email/SMS notifications, and let your hiring team collaborate with scorecards and comments.",
    icon: Workflow,
    bullets: ["Auto stage transitions", "Email/SMS notifications", "Team scorecards & comments"],
    size: "sm",
  },
];

export function FeatureGrid() {
  const headingRef = useSplitTextReveal<HTMLHeadingElement>();
  const gridRef = useGsapReveal<HTMLDivElement>({ y: 28, stagger: 0.08 });

  return (
    <section id="platform" className="py-20 sm:py-28 bg-background relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <div className="text-xs font-medium uppercase tracking-wider text-primary mb-3">
            Six pillars
          </div>
          <h2
            ref={headingRef}
            className="font-serif text-[40px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.025em] text-foreground text-balance"
          >
            <span data-split>Everything you need to go from sourcing to offer.</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            EvalixAI replaces the ad-hoc spreadsheets, shared docs, and manual
            screening calls that startups use today — with an AI-first pipeline
            that scales with your team.
          </p>
        </div>

        <div
          ref={gridRef}
          className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.n}
                data-reveal
                className={`group relative rounded-2xl border border-border bg-card p-6 sm:p-7 hover:border-foreground/20 transition-all hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 ${
                  p.size === "lg" ? "lg:col-span-2 lg:row-span-1" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {p.n}
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-foreground mb-2 leading-tight">
                  {p.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.description}
                </p>
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {p.bullets.map((b) => (
                    <li
                      key={b}
                      className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-foreground/70"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
