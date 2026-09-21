"use client";

/* ------------------------------------------------------------------ */
/* Overview — KPIs, candidate flow, AI insights, funnel, activity       */
/* ------------------------------------------------------------------ */

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Briefcase,
  CalendarClock,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Video,
  ChevronRight,
} from "lucide-react";
import { Counter, EASE } from "@/components/landing/shared";
import { cn } from "@/lib/utils";
import { useDashboard } from "./context";
import { AreaChart, Sparkline, ScoreRing, FunnelBars } from "./charts";
import { STAGE_META } from "./data";

/* Hydration-safe client-only clock (server renders neutral values) */
function useGreetingClock(): { greeting: string; today: string } {
  const snapshot = useSyncExternalStore(
    () => () => {},
    () => {
      const now = new Date();
      const h = now.getHours();
      const g = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
      const d = now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      return `${g}§${d}`;
    },
    () => "§"
  );
  const [greeting, today] = snapshot.split("§");
  return { greeting: greeting || "Welcome back", today: today || "" };
}

const INSIGHT_ICONS = { olive: TrendingUp, amber: AlertTriangle, ink: Lightbulb } as const;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const riseIn = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* Loading skeleton — shown while the first data load is in flight */
function Skeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading dashboard data">
      <div className="h-10 w-72 animate-pulse rounded-xl bg-[#eeece1]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[118px] animate-pulse rounded-2xl border border-[#e5e2d2] bg-[#fffdf7]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-[#eeece1] lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-2xl bg-[#1c1a14]/80" />
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-[#eeece1]" />
    </div>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5", className)}>
      {children}
    </div>
  );
}

export function Overview() {
  const { candidates, jobs, stats, user, toast, loading, generateInsight } = useDashboard();
  const { greeting, today } = useGreetingClock();


  const firstName = user?.name?.split(/\s+/)[0] ?? "there";
  const flow = stats?.flow ?? { labels: [], applied: [], shortlisted: [] };
  const funnel = stats?.funnel ?? [];
  const insights = stats?.insights ?? [];
  const upcoming = stats?.upcoming ?? [];

  const openJobs = jobs.filter((j) => j.status === "open").length;
  const pausedJobs = jobs.length - openJobs;
  const interviewCount = candidates.filter((c) => c.stage === "interview").length;
  const recent = [...candidates]
    .filter((c) => c.stage !== "rejected")
    .sort((a, b) => b.match - a.match)
    .slice(0, 7);

  /* Trend chips derived from live data (no hard-coded numbers) */
  const appliedSeries = flow.applied;
  const appliedDelta =
    appliedSeries.length >= 2 && appliedSeries[appliedSeries.length - 2] > 0
      ? Math.round(
          ((appliedSeries[appliedSeries.length - 1] - appliedSeries[appliedSeries.length - 2]) /
            appliedSeries[appliedSeries.length - 2]) *
            100
        )
      : null;
  const maxMatch = candidates.reduce((m, c) => Math.max(m, c.match), 0);
  const hireRate =
    funnel.length >= 2 && funnel[0].value > 0
      ? Math.round((funnel[funnel.length - 1].value / funnel[0].value) * 1000) / 10
      : null;

  if (loading) return <Skeleton />;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5">
      {/* Greeting row */}
      <motion.div variants={riseIn} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-[28px] leading-tight text-[#1d1b15] sm:text-[32px]">
            {greeting}, {firstName}
          </h2>
          <p className="mt-1 text-[14.5px] text-[#55524a]">
            Here is what is moving in your pipeline{today ? ` — ${today}` : ""}.
          </p>
        </div>
        <span className="rounded-full border border-[#e5e2d2] bg-[#fffdf7] px-4 py-1.5 text-[12.5px] font-medium text-[#55524a]">
          {candidates.length} candidates · {jobs.length} roles
        </span>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <motion.div variants={riseIn}>
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-[#eef0da] text-[#6f7c3d]">
                  <Users className="size-[18px]" />
                </span>
                <span className="text-[13px] font-medium text-[#55524a]">Candidates in pipeline</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e9ecd2] px-2 py-1 text-[11.5px] font-semibold text-[#5a662f]">
                <TrendingUp className={cn("size-3", appliedDelta !== null && appliedDelta < 0 && "rotate-180")} />
                {appliedDelta !== null ? `${appliedDelta >= 0 ? "+" : ""}${appliedDelta}%` : "live"}
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <span className="font-serif-display text-[34px] leading-none tabular-nums text-[#1d1b15]">
                <Counter to={funnel[0]?.value ?? 0} />
              </span>
              <Sparkline data={flow.applied} />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={riseIn}>
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-[#eef0da] text-[#6f7c3d]">
                  <Briefcase className="size-[18px]" />
                </span>
                <span className="text-[13px] font-medium text-[#55524a]">Active jobs</span>
              </div>
              <span className="rounded-full bg-[#f1ecd7] px-2 py-1 text-[11.5px] font-semibold text-[#7a6d2f]">
                {pausedJobs} paused
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <span className="font-serif-display text-[34px] leading-none tabular-nums text-[#1d1b15]">
                <Counter to={openJobs} />
              </span>
              <span className="text-[12px] text-[#8a8578]">{jobs.length} total roles</span>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={riseIn}>
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-[#eef0da] text-[#6f7c3d]">
                  <CalendarClock className="size-[18px]" />
                </span>
                <span className="text-[13px] font-medium text-[#55524a]">Interviews this week</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e9ecd2] px-2 py-1 text-[11.5px] font-semibold text-[#5a662f]">
                <TrendingUp className="size-3" /> {upcoming.length} upcoming
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <span className="font-serif-display text-[34px] leading-none tabular-nums text-[#1d1b15]">
                <Counter to={interviewCount} />
              </span>
              <span className="text-[12px] text-[#8a8578]">scheduled by AI</span>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={riseIn}>
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-[#eef0da] text-[#6f7c3d]">
                  <Target className="size-[18px]" />
                </span>
                <span className="text-[13px] font-medium text-[#55524a]">Avg. match score</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e9ecd2] px-2 py-1 text-[11.5px] font-semibold text-[#5a662f]">
                <TrendingUp className="size-3" /> top {maxMatch}%
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <span className="font-serif-display text-[34px] leading-none tabular-nums text-[#1d1b15]">
                <Counter to={stats?.kpis.avgMatch ?? 0} />
              </span>
              <Sparkline data={flow.shortlisted} />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Flow chart + AI insights */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div variants={riseIn} className="lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif-display text-[19px] text-[#1d1b15]">Candidate flow</h3>
                <p className="text-[12.5px] text-[#8a8578]">
                  Applications vs. shortlisted · last {flow.labels.length || 8} weeks
                </p>
              </div>
            </div>
            {flow.labels.length > 0 ? (
              <AreaChart
                labels={flow.labels}
                series={[
                  { name: "Applied", values: flow.applied, color: "#b9b39c" },
                  { name: "Shortlisted by AI", values: flow.shortlisted, color: "#6f7c3d" },
                ]}
              />
            ) : (
              <div className="grid h-[220px] place-items-center rounded-xl bg-[#faf8ef] text-[13px] text-[#8a8578]">
                No application history yet — metrics appear as candidates flow in.
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={riseIn}>
          <div className="flex h-full flex-col rounded-2xl bg-[#1c1a14] p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-[#2c2a20] text-[#dde0b8]">
                <Sparkles className="size-[18px]" />
              </span>
              <div>
                <h3 className="font-serif-display text-[19px] text-[#f4f2ea]">AI insights</h3>
                <p className="text-[11.5px] text-[#8a8578]">Generated from live pipeline data</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2.5">
              {insights.length === 0 && (
                <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-white/15 p-4 text-center text-[12.5px] leading-relaxed text-[#8a8578]">
                  Insights appear here once your pipeline has screening activity.
                </div>
              )}
              {insights.map((ins, i) => {
                const Icon = INSIGHT_ICONS[ins.tone];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.12, duration: 0.5, ease: EASE }}
                    className="flex items-start gap-3 rounded-xl bg-[#26241d] p-3.5"
                  >
                    <Icon
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        ins.tone === "olive" && "text-[#a9b878]",
                        ins.tone === "amber" && "text-[#d9a45b]",
                        ins.tone === "ink" && "text-[#8a8578]"
                      )}
                    />
                    <p className="text-[13px] leading-relaxed text-[#e5e2d2]">{ins.text}</p>
                  </motion.div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => generateInsight()}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/15 text-[13.5px] font-medium text-[#f4f2ea] transition-colors hover:bg-white/10"
            >
              <Sparkles className="size-3.5 text-[#dde0b8]" />
              Generate fresh AI insight
              <ChevronRight className="size-4" />
            </button>

          </div>
        </motion.div>
      </div>

      {/* Funnel + interviews */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div variants={riseIn} className="lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif-display text-[19px] text-[#1d1b15]">Screening funnel</h3>
                <p className="text-[12.5px] text-[#8a8578]">All roles · rolling 30 days</p>
              </div>
              <span className="hidden items-center gap-1 rounded-full bg-[#e9ecd2] px-2.5 py-1 text-[11.5px] font-semibold text-[#5a662f] sm:inline-flex">
                <TrendingUp className="size-3" /> {hireRate !== null ? `${hireRate}% applied → hired` : "live"}
              </span>
            </div>
            {funnel.length > 0 ? (
              <FunnelBars data={funnel} />
            ) : (
              <div className="grid h-[220px] place-items-center rounded-xl bg-[#faf8ef] text-[13px] text-[#8a8578]">
                The screening funnel fills up as applicants move through stages.
              </div>
            )}
            <p className="mt-4 border-t border-[#e5e2d2] pt-3 text-[12.5px] leading-relaxed text-[#8a8578]">
              AI screening keeps{" "}
              {funnel.length >= 2 && funnel[0].value > 0
                ? Math.round((funnel[1].value / funnel[0].value) * 100)
                : "most"}{" "}
              of qualified applicants moving without a human touch — your team only sees the top of the
              funnel.
            </p>
          </Card>
        </motion.div>

        <motion.div variants={riseIn}>
          <Card className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif-display text-[19px] text-[#1d1b15]">Upcoming interviews</h3>
            </div>
            <div className="flex flex-1 flex-col gap-2.5">
              {upcoming.map((iv, i) => {
                const cand = candidates.find((c) => c.id === iv.id);
                return (
                  <motion.div
                    key={iv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.45, ease: EASE }}
                    className="flex items-center gap-3 rounded-xl border border-[#e5e2d2] p-3"
                  >
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-full text-[12.5px] font-bold",
                        cand?.avatarClass
                      )}
                    >
                      {iv.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-[#1d1b15]">
                        {iv.name}
                      </span>
                      <span className="block truncate text-[12px] text-[#8a8578]">
                        {iv.role} · {iv.when}
                      </span>
                    </span>
                    <span title="AI readiness" className="shrink-0">
                      <ScoreRing value={iv.readiness} size={38} stroke={3.5} />
                    </span>
                    <button
                      type="button"
                      aria-label={`Join interview with ${iv.name}`}
                      onClick={() => {
                        try {
                          navigator.clipboard?.writeText(`https://meet.evalix.ai/${iv.id}`);
                        } catch {
                          /* clipboard unavailable — toast still confirms */
                        }
                        toast(`Meeting link for ${iv.name} copied to clipboard`, { tone: "info" });
                      }}
                      className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#6f7c3d] text-white transition-colors hover:bg-[#5a662f]"
                    >
                      <Video className="size-4" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
            <p className="mt-4 border-t border-[#e5e2d2] pt-3 text-[12px] text-[#8a8578]">
              Rings show AI readiness — predicted pass rate from resume, assessment and sandbox signals.
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Recent candidates */}
      <motion.div variants={riseIn}>
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 pb-1 pt-5">
            <div>
              <h3 className="font-serif-display text-[19px] text-[#1d1b15]">Top-ranked candidates</h3>
              <p className="text-[12.5px] text-[#8a8578]">Highest matches across all open roles</p>
            </div>
            <Link
              href="/dashboard/candidates"
              className="inline-flex items-center gap-1 text-[13.5px] font-medium text-[#6f7c3d] transition-colors hover:text-[#5a662f]"
            >
              View all <ChevronRight className="size-4" />
            </Link>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13.5px]">
              <thead>
                <tr className="border-y border-[#e5e2d2] bg-[#faf8ef] text-[11px] uppercase tracking-[0.08em] text-[#8a8578]">
                  <th className="px-5 py-2.5 font-semibold">Candidate</th>
                  <th className="px-3 py-2.5 font-semibold">Role</th>
                  <th className="px-3 py-2.5 font-semibold">Stage</th>
                  <th className="px-3 py-2.5 font-semibold">Match</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[13.5px] text-[#8a8578]">
                      No active candidates in the pipeline. Upload candidate resumes to begin automated screening.
                    </td>
                  </tr>
                ) : (
                  recent.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => window.location.assign("/dashboard/candidates")}
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
                            <span className="block font-semibold text-[#1d1b15]">{c.name}</span>
                            <span className="block text-[12px] text-[#8a8578]">{c.email}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[#55524a]">{c.role}</td>
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
                        <ScoreRing value={c.match} size={38} stroke={3.5} />
                      </td>
                      <td className="px-5 py-3 text-right text-[12.5px] text-[#8a8578]">{c.updated}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
