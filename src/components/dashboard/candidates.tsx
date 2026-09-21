"use client";

/* ------------------------------------------------------------------ */
/* Candidates — searchable, filterable, sortable table + detail drawer  */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  ChevronDown,
  Eye,
  ArrowRightCircle,
  X,
  Star,
  Check,
  CircleAlert,
  CalendarClock,
  Quote,
  Code2,
  FileText,
  Sparkles,
  RotateCcw,
  Plus,
} from "lucide-react";
import { EASE } from "@/components/landing/shared";
import { cn } from "@/lib/utils";
import { useDashboard } from "./context";
import { ScoreRing } from "./charts";
import { STAGE_FLOW, STAGE_META, type Candidate, type Stage } from "./data";

type SortKey = "recent" | "match" | "name";

const FILTERS: (Stage | "all")[] = [
  "all",
  "screening",
  "assessment",
  "interview",
  "offer",
  "hired",
  "rejected",
];

/* ------------------------------------------------------------------ */
/* Detail drawer                                                        */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "overview", label: "Overview", icon: FileText },
  { key: "assessment", label: "Assessment", icon: Sparkles },
  { key: "interview", label: "Interview", icon: CalendarClock },
  { key: "task", label: "Sandbox", icon: Code2 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 text-[13px] text-[#55524a]">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e5e2d2]">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, ease: EASE }}
          style={{ width: `${value}%` }}
          className={cn(
            "h-full origin-left rounded-full",
            value >= 85 ? "bg-[#6f7c3d]" : value >= 70 ? "bg-[#8a9455]" : value >= 50 ? "bg-[#c9b96a]" : "bg-[#a15b48]"
          )}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-[12.5px] font-semibold tabular-nums text-[#1d1b15]">
        {value}
      </span>
    </div>
  );
}

function EmptyTab({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-[#eeece1] text-[#8a8578]">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-serif-display text-[17px] text-[#1d1b15]">{title}</p>
        <p className="mt-1 max-w-[300px] text-[13px] leading-relaxed text-[#8a8578]">{body}</p>
      </div>
      {action}
    </div>
  );
}

function Drawer({
  candidate,
  onClose,
}: {
  candidate: Candidate;
  onClose: () => void;
}) {
  const { advanceStage, rejectCandidate, toggleShortlist } = useDashboard();
  const [tab, setTab] = useState<TabKey>("overview");
  const nextIdx = STAGE_FLOW.indexOf(candidate.stage);
  const nextStage = nextIdx >= 0 && nextIdx < STAGE_FLOW.length - 1 ? STAGE_FLOW[nextIdx + 1] : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-[#1d1b15]/45 backdrop-blur-[2px]"
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-[540px] flex-col bg-[#fffdf7] shadow-[0_0_80px_rgba(29,27,21,0.3)]"
        role="dialog"
        aria-label={`Candidate details — ${candidate.name}`}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[#e5e2d2] p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "grid size-14 shrink-0 place-items-center rounded-2xl text-[16px] font-bold",
                  candidate.avatarClass
                )}
              >
                {candidate.initials}
              </span>
              <div>
                <h3 className="font-serif-display text-[22px] leading-tight text-[#1d1b15]">
                  {candidate.name}
                </h3>
                <p className="mt-0.5 text-[13.5px] text-[#55524a]">{candidate.role}</p>
                <p className="mt-0.5 text-[12.5px] text-[#8a8578]">
                  {candidate.location} · Applied {candidate.appliedAt.toLowerCase()} · {candidate.source}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleShortlist(candidate.id)}
                aria-label="Toggle shortlist"
                title={candidate.shortlisted ? "Remove from shortlist" : "Add to shortlist"}
                className={cn(
                  "grid size-9 place-items-center rounded-lg transition-colors",
                  candidate.shortlisted
                    ? "bg-[#dde0b8] text-[#454e1e]"
                    : "text-[#8a8578] hover:bg-[#eeece1] hover:text-[#1d1b15]"
                )}
              >
                <Star className={cn("size-4", candidate.shortlisted && "fill-current")} />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="grid size-9 place-items-center rounded-lg text-[#8a8578] transition-colors hover:bg-[#eeece1] hover:text-[#1d1b15]"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold",
                STAGE_META[candidate.stage].chip
              )}
            >
              {STAGE_META[candidate.stage].label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f2ea] px-3 py-1 text-[12px] font-medium text-[#55524a]">
              <span className="size-1.5 rounded-full bg-[#6f7c3d]" />
              {candidate.email}
            </span>
            <span className="ml-auto flex items-center gap-2">
              <ScoreRing value={candidate.match} size={46} stroke={4} />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8578]">
                Match
              </span>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex shrink-0 gap-1 border-b border-[#e5e2d2] px-4"
          role="tablist"
          aria-label="Candidate details"
        >
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3.5 py-3 text-[13px] font-medium transition-colors",
                  active ? "text-[#1d1b15]" : "text-[#8a8578] hover:text-[#55524a]"
                )}
              >
                <t.icon className="size-[15px]" />
                {t.label}
                {active && (
                  <motion.span
                    layoutId="drawer-tab"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    className="absolute inset-x-2 -bottom-px h-[2.5px] rounded-full bg-[#6f7c3d]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="nota-scroll flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="flex flex-col gap-5"
            >
              {tab === "overview" && (
                <>
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8578]">
                      AI resume screen
                    </p>
                    <p className="text-[14px] leading-relaxed text-[#55524a]">{candidate.summary}</p>
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8578]">
                      Signal breakdown
                    </p>
                    <div className="flex flex-col gap-2.5">
                      <ScoreRow label="Resume screen" value={candidate.scores.resume} />
                      <ScoreRow label="Assessment" value={candidate.scores.assessment} />
                      <ScoreRow label="AI interview" value={candidate.scores.interview} />
                      <ScoreRow label="Sandbox task" value={candidate.scores.task} />
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8578]">
                      Matched skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.matched.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-[#dde0b8] px-2.5 py-1 text-[12px] font-medium text-[#454e1e]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  {candidate.missing.length > 0 && (
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8578]">
                        Gaps to probe
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.missing.map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-dashed border-[#d9d5c3] px-2.5 py-1 text-[12px] font-medium text-[#8a8578]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {tab === "assessment" && (
                <>
                  <div>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8578]">
                      Auto-scored sections
                    </p>
                    <div className="flex flex-col gap-3.5">
                      {candidate.assessmentSections.map((s, i) => (
                        <ScoreRow key={s.label} label={s.label} value={s.score} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#f4f2ea] p-4">
                    <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#7a6d2f]">
                      <Sparkles className="size-3.5" /> EvalixAI note
                    </p>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-[#55524a]">
                      {candidate.scores.assessment >= 80
                        ? "Consistently above the bar across sections — safe to fast-track to the next stage."
                        : candidate.scores.assessment > 0
                          ? "Mixed signals: strong sections offset by weaker ones. A human review is recommended before advancing."
                          : "Assessment not taken yet — this candidate is still in the early pipeline."}
                    </p>
                  </div>
                </>
              )}

              {tab === "interview" &&
                (candidate.interview ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#f4f2ea] px-3 py-1 text-[12.5px] font-medium text-[#55524a]">
                        {candidate.interview.when}
                      </span>
                      <span className="rounded-full bg-[#f4f2ea] px-3 py-1 text-[12.5px] font-medium text-[#55524a]">
                        {candidate.interview.minutes} min
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-[12.5px] font-semibold",
                          candidate.interview.verdict === "No hire"
                            ? "bg-[#f2e2da] text-[#a15b48]"
                            : "bg-[#dde0b8] text-[#454e1e]"
                        )}
                      >
                        {candidate.interview.verdict}
                      </span>
                    </div>
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8578]">
                        Strengths
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {candidate.interview.strengths.map((s) => (
                          <li key={s} className="flex items-start gap-2 text-[13.5px] text-[#55524a]">
                            <Check className="mt-0.5 size-4 shrink-0 text-[#6f7c3d]" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {candidate.interview.improvements.length > 0 && (
                      <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8578]">
                          Watch-outs
                        </p>
                        <ul className="flex flex-col gap-1.5">
                          {candidate.interview.improvements.map((s) => (
                            <li key={s} className="flex items-start gap-2 text-[13.5px] text-[#55524a]">
                              <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#c98a4b]" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="relative rounded-xl border-l-[3px] border-[#6f7c3d] bg-[#f4f2ea] p-4 pl-5">
                      <Quote className="absolute -left-0 -top-0 size-4 text-[#6f7c3d]" />
                      <p className="text-[14px] italic leading-relaxed text-[#1d1b15]">
                        “{candidate.interview.quote}”
                      </p>
                      <p className="mt-2 text-[12px] text-[#8a8578]">— AI interview highlight</p>
                    </div>
                    <div className="pt-2">
                      <Link
                        href={`/interview/int-${candidate.id}`}
                        target="_blank"
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#6f7c3d] bg-transparent text-[13.5px] font-medium text-[#6f7c3d] transition-colors hover:bg-[#6f7c3d] hover:text-white"
                      >
                        <CalendarClock className="size-4" /> Open Candidate Interview Room
                      </Link>
                    </div>
                  </>
                ) : (
                  <EmptyTab
                    icon={CalendarClock}
                    title="AI interview not scheduled yet"
                    body="EvalixAI runs a 30-minute adaptive interview, then returns strengths, watch-outs and a verdict — without your team spending a minute."
                    action={
                      <div className="flex flex-col gap-2 w-full max-w-[280px]">
                        <Link
                          href={`/interview/int-${candidate.id}`}
                          target="_blank"
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#6f7c3d] px-5 text-[13.5px] font-medium text-white transition-colors hover:bg-[#5a662f]"
                        >
                          <CalendarClock className="size-4" /> Launch AI Interview Room
                        </Link>
                        <button
                          type="button"
                          onClick={() => advanceStage(candidate.id)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#e5e2d2] text-[12.5px] font-medium text-[#55524a] transition-colors hover:bg-[#eeece1]"
                        >
                          Advance to Interview Stage
                        </button>
                      </div>
                    }
                  />
                ))}

              {tab === "task" &&
                (candidate.task ? (
                  <>
                    <div className="rounded-xl border border-[#e5e2d2] p-4">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#8a8578]">
                        Sandbox task
                      </p>
                      <p className="mt-1 font-serif-display text-[17px] text-[#1d1b15]">
                        {candidate.task.title}
                      </p>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-lg bg-[#f4f2ea] p-3">
                          <p className="font-serif-display text-[22px] tabular-nums text-[#1d1b15]">
                            {candidate.task.passed}/{candidate.task.total}
                          </p>
                          <p className="text-[11px] text-[#8a8578]">Tests passed</p>
                        </div>
                        <div className="rounded-lg bg-[#f4f2ea] p-3">
                          <p className="font-serif-display text-[22px] tabular-nums text-[#1d1b15]">
                            {candidate.task.quality}
                          </p>
                          <p className="text-[11px] text-[#8a8578]">Code quality</p>
                        </div>
                        <div className="rounded-lg bg-[#f4f2ea] p-3">
                          <p className="font-serif-display text-[22px] tabular-nums text-[#1d1b15]">
                            {candidate.task.minutes}m
                          </p>
                          <p className="text-[11px] text-[#8a8578]">Time spent</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#1c1a14] p-4">
                      <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#8a8578]">
                        <Code2 className="size-3.5" /> EvalixAI review
                      </p>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-[#e5e2d2]">
                        {candidate.task.note}
                      </p>
                    </div>
                  </>
                ) : (
                  <EmptyTab
                    icon={Code2}
                    title="No sandbox task yet"
                    body="Send a coding or design task to see how this candidate actually works — auto-graded tests, code-quality signals and time-on-task included."
                  />
                ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center gap-2.5 border-t border-[#e5e2d2] p-4">
          {candidate.stage === "hired" ? (
            <p className="flex w-full items-center justify-center gap-2 rounded-full bg-[#dde0b8] py-3 text-[13.5px] font-semibold text-[#454e1e]">
              <Check className="size-4" /> Hired — Offer accepted
            </p>
          ) : candidate.stage === "rejected" ? (
            <p className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f2e2da] py-3 text-[13.5px] font-semibold text-[#a15b48]">
              <X className="size-4" /> Rejected
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  rejectCandidate(candidate.id);
                }}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#e0c9bf] text-[13.5px] font-medium text-[#a15b48] transition-colors hover:bg-[#f9ece6]"
              >
                <X className="size-4" /> Reject
              </button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                onClick={() => advanceStage(candidate.id)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#6f7c3d] text-[13.5px] font-medium text-white transition-colors hover:bg-[#5a662f]"
              >
                {nextStage ? (
                  <>
                    Advance to {STAGE_META[nextStage].label}
                    <ArrowRightCircle className="size-4" />
                  </>
                ) : (
                  "Advance"
                )}
              </motion.button>
            </>
          )}
        </div>
      </motion.aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Candidates view                                                      */
/* ------------------------------------------------------------------ */

export function Candidates() {
  const { candidates, searchQuery, setSearchQuery, advanceStage, setNewCandidateOpen, toast, loading } = useDashboard();
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = candidates;
    if (stageFilter !== "all") list = list.filter((c) => c.stage === stageFilter);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sort === "match") sorted.sort((a, b) => b.match - a.match);
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else sorted.sort((a, b) => a.appliedDays - b.appliedDays);
    return sorted;
  }, [candidates, stageFilter, searchQuery, sort]);

  const counts = useMemo(() => {
    const m = new Map<Stage | "all", number>([["all", candidates.length]]);
    for (const c of candidates) m.set(c.stage, (m.get(c.stage) ?? 0) + 1);
    return m;
  }, [candidates]);

  const selected = candidates.find((c) => c.id === selectedId) ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col gap-4"
    >
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8a8578]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="search"
            placeholder="Search name, role or email…"
            aria-label="Search candidates"
            className="h-11 w-full rounded-xl border border-[#e5e2d2] bg-[#fffdf7] pl-10 pr-4 text-[14px] text-[#1d1b15] placeholder:text-[#8a8578] transition-colors focus:border-[#6f7c3d] focus:outline-none focus:ring-2 focus:ring-[#dde0b8]"
          />
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort candidates"
            className="h-11 appearance-none rounded-xl border border-[#e5e2d2] bg-[#fffdf7] pl-4 pr-9 text-[13.5px] font-medium text-[#55524a] transition-colors focus:border-[#6f7c3d] focus:outline-none"
          >
            <option value="recent">Most recent</option>
            <option value="match">Match score</option>
            <option value="name">Name A–Z</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8a8578]" />
        </div>
        <button
          type="button"
          onClick={() => setNewCandidateOpen(true)}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-[#6f7c3d] px-4 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#5a662f]"
        >
          <Plus className="size-4" />
          <span>Add candidate</span>
        </button>
        <p className="ml-auto text-[13px] text-[#8a8578]">
          Showing <span className="font-semibold text-[#1d1b15]">{filtered.length}</span> of{" "}
          {candidates.length}
        </p>
      </div>

      {/* Stage filter chips */}
      <div className="nota-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const active = stageFilter === f;
          const label = f === "all" ? "All" : STAGE_META[f].label;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setStageFilter(f)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-all",
                active
                  ? "border-[#1d1b15] bg-[#1d1b15] text-[#f4f2ea]"
                  : "border-[#e5e2d2] bg-[#fffdf7] text-[#55524a] hover:border-[#d9d5c3] hover:bg-[#faf8ef]"
              )}
            >
              {label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                  active ? "bg-white/15 text-[#f4f2ea]" : "bg-[#eeece1] text-[#8a8578]"
                )}
              >
                {counts.get(f) ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e5e2d2] bg-[#fffdf7]">
        <div className="nota-scroll overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-[#e5e2d2] bg-[#faf8ef] text-[11px] uppercase tracking-[0.08em] text-[#8a8578]">
                <th className="px-5 py-3 font-semibold">Candidate</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Stage</th>
                <th className="px-3 py-3 font-semibold">Match</th>
                <th className="px-3 py-3 font-semibold">Assessment</th>
                <th className="px-3 py-3 font-semibold">Applied</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <tr key={`sk-${i}`} className="border-b border-[#eeece1] last:border-0">
                      <td colSpan={7} className="px-5 py-3.5">
                        <div className="h-9 animate-pulse rounded-lg bg-[#eeece1]" />
                      </td>
                    </tr>
                  ))}
                </>
              )}
              <AnimatePresence initial={false}>
                {filtered.map((c) => {
                  const done = c.stage === "hired" || c.stage === "rejected";
                  return (
                    <motion.tr
                      key={c.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      onClick={() => setSelectedId(c.id)}
                      className="cursor-pointer border-b border-[#eeece1] transition-colors last:border-0 hover:bg-[#faf8ef]"
                    >
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              "grid size-9 shrink-0 place-items-center rounded-full text-[11.5px] font-bold",
                              c.avatarClass
                            )}
                          >
                            {c.initials}
                          </span>
                          <span>
                            <span className="flex items-center gap-1.5 font-semibold text-[#1d1b15]">
                              {c.name}
                              {c.shortlisted && (
                                <Star className="size-3 fill-[#c9b96a] text-[#c9b96a]" aria-label="Shortlisted" />
                              )}
                            </span>
                            <span className="block text-[12px] text-[#8a8578]">{c.email}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="block text-[#55524a]">{c.role}</span>
                        <span className="block text-[12px] text-[#8a8578]">{c.source}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
                            STAGE_META[c.stage].chip
                          )}
                        >
                          {STAGE_META[c.stage].label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <ScoreRing value={c.match} size={40} stroke={3.5} />
                      </td>
                      <td className="px-3 py-3 tabular-nums text-[#55524a]">
                        {c.scores.assessment ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="h-1.5 w-14 overflow-hidden rounded-full bg-[#e5e2d2]">
                              <motion.span
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.8, ease: EASE }}
                                style={{ width: `${c.scores.assessment}%` }}
                                className={cn(
                                  "block h-full origin-left rounded-full",
                                  c.scores.assessment >= 85
                                    ? "bg-[#6f7c3d]"
                                    : c.scores.assessment >= 70
                                      ? "bg-[#8a9455]"
                                      : "bg-[#a15b48]"
                                )}
                              />
                            </span>
                            {c.scores.assessment}
                          </span>
                        ) : (
                          <span className="text-[#c2bda9]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-[12.5px] text-[#8a8578]">{c.appliedAt}</td>
                      <td className="px-5 py-3">
                        <span className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(c.id);
                            }}
                            aria-label={`View ${c.name}`}
                            title="View details"
                            className="grid size-8 place-items-center rounded-lg text-[#8a8578] transition-colors hover:bg-[#eeece1] hover:text-[#1d1b15]"
                          >
                            <Eye className="size-4" />
                          </button>
                          {done ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast(
                                  c.stage === "hired"
                                    ? `${c.name} is already hired — congratulations!`
                                    : `${c.name} was rejected. Undo from the notification toast.`,
                                  { tone: "info" }
                                );
                              }}
                              aria-label="Finished"
                              title="Pipeline finished"
                              className="grid size-8 cursor-default place-items-center rounded-lg text-[#c2bda9]"
                            >
                              <RotateCcw className="size-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                advanceStage(c.id);
                              }}
                              aria-label={`Advance ${c.name}`}
                              title="Advance stage"
                              className="grid size-8 place-items-center rounded-lg text-[#8a8578] transition-colors hover:bg-[#dde0b8] hover:text-[#454e1e]"
                            >
                              <ArrowRightCircle className="size-4" />
                            </button>
                          )}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#eeece1] text-[#8a8578]">
                <Search className="size-5" />
              </span>
              <div>
                <p className="font-serif-display text-[17px] text-[#1d1b15]">No candidates found</p>
                <p className="mt-1 text-[13px] text-[#8a8578]">
                  Try a different search or clear the stage filter.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStageFilter("all");
                  setSearchQuery("");
                }}
                className="h-9 rounded-full border border-[#d9d5c3] bg-[#fffdf7] px-4 text-[13px] font-medium text-[#55524a] transition-colors hover:bg-[#faf8ef]"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selected && <Drawer candidate={selected} onClose={() => setSelectedId(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
