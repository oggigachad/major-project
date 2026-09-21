"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ScanText,
  ListChecks,
  MessageSquare,
  CalendarDays,
  FileStack,
  Sparkles,
  Sprout,
  Mic,
  Video,
  PhoneOff,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { PrimaryButton, ScoreBar, EASE } from "./shared";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* macOS-style app window mockup — candidate ranking + AI interview    */
/* ------------------------------------------------------------------ */

function CandidateRow({
  name,
  role,
  score,
  tag,
  delay,
}: {
  name: string;
  role: string;
  score: number;
  tag: "Top match" | "Strong" | "Review";
  delay: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#eeece1] bg-[#faf8f0] px-3 py-2.5 transition-colors duration-300 hover:border-[#d9d5c3]">
      <span className="size-7 shrink-0 rounded-full bg-[#e6e2cd]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[13px] font-medium text-[#1d1b15]">
            {name}
            <span className="ml-1.5 hidden text-[11.5px] font-normal text-[#8a8578] sm:inline">
              {role}
            </span>
          </p>
          <span className="text-[12px] font-semibold text-[#6f7c3d]">
            {score}%
          </span>
        </div>
        <ScoreBar value={score} delay={delay} className="mt-1.5 h-1" />
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
          tag === "Review"
            ? "bg-[#1d1b15]/[0.06] text-[#55524a]"
            : "bg-[#dde0b8] text-[#3f4821]"
        )}
      >
        {tag}
      </span>
    </div>
  );
}

function AppWindow() {
  return (
    <div className="relative w-full max-w-[560px]">
      {/* Main ranking window */}
      <div className="overflow-hidden rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] shadow-[0_24px_60px_-12px_rgba(29,27,21,0.22)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-[#eeece1] bg-[#faf8f0] px-4 py-3">
          <span className="size-3 rounded-full bg-[#e08572]" />
          <span className="size-3 rounded-full bg-[#e6c069]" />
          <span className="size-3 rounded-full bg-[#a3bf7a]" />
          <div className="ml-3 flex items-center gap-2 text-[13px] text-[#55524a]">
            <span className="rounded-md bg-[#1d1b15]/[0.06] px-2 py-1 font-medium text-[#1d1b15]">
              Senior Frontend Engineer
            </span>
            <span className="hidden items-center gap-1 text-[12px] sm:flex">
              <CalendarDays className="size-3.5" /> Today
            </span>
            <span className="hidden items-center gap-1 text-[12px] sm:flex">
              <FileStack className="size-3.5" /> 128
            </span>
          </div>
          <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-[#1d1b15] px-2.5 py-1 text-[11px] font-medium text-[#f4f2ea] sm:flex">
            <span className="nota-pulse size-1.5 rounded-full bg-[#e08572]" />
            Auto-screening
          </span>
        </div>

        {/* Body — fades out gracefully at the bottom */}
        <div className="relative">
          <div className="nota-scroll max-h-[330px] space-y-5 overflow-y-auto px-5 py-5 text-[13.5px] leading-relaxed text-[#33302a] sm:px-6">
            <div>
              <p className="font-serif-display text-[17px] font-medium text-[#1d1b15]">
                Hiring pipeline
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[#8a8578]">
                <Sparkles className="size-3.5 text-[#6f7c3d]" />
                EvalixAI screened 128 resumes overnight
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8a8578]">
                Ranked candidates
              </p>
              <div className="space-y-2">
                <CandidateRow
                  name="Maya Chen"
                  role="ex-Loopwork"
                  score={92}
                  tag="Top match"
                  delay={0.5}
                />
                <CandidateRow
                  name="Daniel Okafor"
                  role="ex-Kestrel"
                  score={88}
                  tag="Strong"
                  delay={0.65}
                />
                <CandidateRow
                  name="Tom Alvarez"
                  role="ex-Brightfold"
                  score={84}
                  tag="Review"
                  delay={0.8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8a8578]">
                Next steps
              </p>
              <ul className="space-y-1.5">
                <li className="flex gap-2 text-[13px]">
                  <span className="mt-[2px] rounded bg-[#dde0b8] px-1.5 py-px text-[11px] font-medium text-[#4a5327]">
                    9
                  </span>
                  <span>Candidates matched your must-haves</span>
                </li>
                <li className="flex gap-2 text-[13px]">
                  <span className="mt-[2px] rounded bg-[#dde0b8] px-1.5 py-px text-[11px] font-medium text-[#4a5327]">
                    2
                  </span>
                  <span>Flagged for staff-level scope</span>
                </li>
              </ul>
            </div>
          </div>
          {/* Soft fade so overflow reads as intentional, not clipped */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#fffdf7] to-transparent"
            aria-hidden
          />
        </div>
      </div>

      {/* Floating AI interview overlay */}
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-8 -right-3 w-[220px] rotate-[2.5deg] sm:-right-8 sm:w-[250px]"
      >
        <div className="overflow-hidden rounded-xl border border-[#e5e2d2] bg-[#1c1a14] shadow-[0_18px_40px_-10px_rgba(29,27,21,0.4)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
            <span className="flex items-center gap-2 text-[11.5px] font-medium text-[#f4f2ea]">
              <span className="grid size-6 place-items-center rounded-full bg-[#6f7c3d]">
                <MessageSquare className="size-3 text-white" />
              </span>
              AI interview
            </span>
            <span className="text-[11px] tabular-nums text-[#8a8578]">
              12:40
            </span>
          </div>

          {/* Question bubble + waveform */}
          <div className="space-y-3 px-3 py-3">
            <p className="rounded-lg rounded-tl-sm bg-[#2e2b22] px-3 py-2 text-[12px] leading-snug text-[#ece9dd]">
              Walk me through a migration you led. What would you do
              differently?
            </p>
            <div className="flex h-6 items-end justify-center gap-1 pb-1">
              {[0, 0.15, 0.3, 0.1, 0.45, 0.2, 0.35, 0.05, 0.25, 0.4].map(
                (d, i) => (
                  <span
                    key={i}
                    className="nota-wave w-[3px] rounded-full bg-[#a3bf7a]"
                    style={{
                      height: `${[30, 45, 60, 35, 75, 40, 55, 28, 48, 68][i]}%`,
                      animationDelay: `${d}s`,
                    }}
                  />
                )
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 border-t border-white/10 px-3 py-2.5">
            <span className="grid size-7 place-items-center rounded-full bg-white/10 text-white/85">
              <Mic className="size-3.5" />
            </span>
            <span className="grid size-7 place-items-center rounded-full bg-white/10 text-white/85">
              <Video className="size-3.5" />
            </span>
            <span className="grid size-7 place-items-center rounded-full bg-[#c0563f] text-white">
              <PhoneOff className="size-3.5" />
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const HERO_BULLETS = [
  {
    icon: ScanText,
    text: "AI resume screening that looks beyond keywords",
  },
  {
    icon: ListChecks,
    text: "Aptitude, technical and coding assessments, automated",
  },
  {
    icon: MessageSquare,
    text: "AI mock interviews with instant, detailed feedback",
  },
];

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function Hero() {
  /* Subtle 3D tilt that follows the cursor */
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [2.5, -2.5]), {
    stiffness: 140,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-2.5, 2.5]), {
    stiffness: 140,
    damping: 18,
  });

  return (
    <section id="top" className="relative overflow-hidden pt-16">
      {/* Warm glow backdrop */}
      <div className="nota-warm-glow pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20 lg:pb-32">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-10">
          {/* Left column — staggered entrance */}
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            <motion.a
              variants={itemVariants}
              href="#sandbox"
              className="group inline-flex items-center gap-2 rounded-full bg-[#dde0b8] py-1.5 pl-2 pr-3.5 text-[13px] font-medium text-[#3f4821] transition-shadow duration-300 hover:shadow-[0_4px_16px_rgba(111,124,61,0.25)]"
            >
              <span className="rounded-full bg-[#3f4821] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#f4f2ea]">
                New
              </span>
              AI coding sandbox
              <ChevronDown className="size-3.5 -rotate-90 transition-transform duration-300 group-hover:translate-x-0.5" />
            </motion.a>

            <motion.h1
              variants={itemVariants}
              className="font-serif-display mt-6 text-balance text-[44px] font-medium leading-[1.04] tracking-[-0.02em] text-[#1d1b15] sm:text-[64px] lg:text-[68px]"
            >
              The AI recruiter for early&#8209;stage hiring
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-5 max-w-md text-[18px] leading-relaxed text-[#55524a]"
            >
              Screening, assessments and interviews —{" "}
              <span className="font-medium text-[#1d1b15]">
                without an HR team.
              </span>
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <PrimaryButton className="h-12 px-7 text-base" href="/signup">
                Start screening free
                <ChevronDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              </PrimaryButton>
              <p className="flex items-center gap-1.5 text-[13.5px] text-[#8a8578] sm:ml-2">
                <Sprout className="size-4" />
                Built for startups and small businesses
              </p>
            </motion.div>

            <motion.ul
              variants={itemVariants}
              className="mt-10 space-y-3.5 border-t border-[#e5e2d2] pt-8"
            >
              {HERO_BULLETS.map((item) => (
                <li
                  key={item.text}
                  className="flex items-center gap-3"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#e5e2d2] bg-white/70 text-[#6f7c3d] transition-transform duration-300 group-hover/list:scale-110">
                    <item.icon className="size-4" />
                  </span>
                  <span className="text-[15px] text-[#33302a]">
                    {item.text}
                  </span>
                </li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Right column — app mockup with cursor tilt */}
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, delay: 0.2, ease: EASE }}
            className="relative mx-auto w-full justify-self-center pb-10 pr-3 sm:pr-8 lg:pb-12"
          >
            <motion.div
              style={{ rotateX, rotateY, transformPerspective: 1100 }}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                mouseX.set((e.clientX - r.left) / r.width);
                mouseY.set((e.clientY - r.top) / r.height);
              }}
              onMouseLeave={() => {
                mouseX.set(0.5);
                mouseY.set(0.5);
              }}
            >
              <AppWindow />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
