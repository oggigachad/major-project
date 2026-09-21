"use client";

/* ------------------------------------------------------------------ */
/* Analytics — Recruitment pipeline velocity, funnel & intelligence    */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Award,
  Users,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { ScoreRing } from "./charts";

interface AnalyticsData {
  kpis: {
    total_applicants: number;
    active_jobs: number;
    avg_match_rate: number;
    avg_interview_score: number;
    time_to_hire_days: number;
    interview_completion_rate: number;
    pass_through_rate: number;
  };
  funnel: Array<{ stage: string; count: number; rate: number }>;
  stage_counts: Record<string, number>;
  top_skills: Array<{ skill: string; count: number }>;
  total_interviews: number;
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/v1/analytics/overview");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const kpis = data?.kpis || {
    total_applicants: 0,
    active_jobs: 0,
    avg_match_rate: 0,
    avg_interview_score: 0,
    time_to_hire_days: 0,
    interview_completion_rate: 0,
    pass_through_rate: 0,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e5e2d2] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#eef0da] text-[#6f7c3d]">
              <BarChart3 className="size-5" />
            </span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6f7c3d]">
              Pipeline Intelligence
            </span>
          </div>
          <h2 className="mt-2 font-serif-display text-[28px] leading-tight text-[#1d1b15] sm:text-[32px]">
            Hiring Analytics & Velocity
          </h2>
          <p className="mt-1 text-[14px] text-[#716d63]">
            Real-time pipeline metrics, stage conversion rates, AI assessment outcomes, and skill trends.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 rounded-full border border-[#e5e2d2] bg-[#fffdf7] px-4 py-2 text-[13px] font-medium text-[#55524a] shadow-sm transition-colors hover:bg-[#faf8ef]"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Refresh Metrics
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#716d63]">Total Applicants</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#faf8ef] text-[#6f7c3d]">
              <Users className="size-4" />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-bold tracking-tight text-[#1d1b15]">{kpis.total_applicants}</div>
          <p className="mt-1 text-[12px] text-[#8a8578]">Active across all roles</p>
        </div>

        <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#716d63]">Time to Hire</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#faf8ef] text-[#6f7c3d]">
              <Clock className="size-4" />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-bold tracking-tight text-[#1d1b15]">
            {kpis.time_to_hire_days > 0 ? `${kpis.time_to_hire_days}d` : "—"}
          </div>
          <p className="mt-1 text-[12px] text-[#8a8578]">Application to offer average</p>
        </div>

        <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#716d63]">Avg Match Score</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#faf8ef] text-[#6f7c3d]">
              <Award className="size-4" />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-bold tracking-tight text-[#1d1b15]">
            {kpis.avg_match_rate > 0 ? `${kpis.avg_match_rate}%` : "—"}
          </div>
          <p className="mt-1 text-[12px] text-[#8a8578]">AI resume semantic alignment</p>
        </div>

        <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#716d63]">Interview Pass Rate</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#eef3db] text-[#4d5724]">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-bold tracking-tight text-[#1d1b15]">
            {kpis.pass_through_rate > 0 ? `${kpis.pass_through_rate}%` : "—"}
          </div>
          <p className="mt-1 text-[12px] text-[#8a8578]">Interview to offer conversion</p>
        </div>
      </div>

      {/* Funnel and Conversion Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recruitment Funnel */}
        <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif-display text-[20px] text-[#1d1b15]">Stage Conversion Funnel</h3>
              <p className="text-[12.5px] text-[#8a8578]">Candidate progression across pipeline milestones</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eef0da] px-3 py-1 text-[12px] font-semibold text-[#5a662f]">
              <Zap className="size-3" /> Live
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {(data?.funnel || [
              { stage: "Screening", count: 0, rate: 100 },
              { stage: "Assessment", count: 0, rate: 0 },
              { stage: "Interview", count: 0, rate: 0 },
              { stage: "Offer", count: 0, rate: 0 },
              { stage: "Hired", count: 0, rate: 0 },
            ]).map((step, idx) => {
              const maxCount = Math.max(1, ...(data?.funnel || []).map((f) => f.count));
              const widthPct = Math.max(8, Math.round((step.count / maxCount) * 100));

              return (
                <div key={step.stage} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-[#1d1b15]">{step.stage}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#1d1b15]">{step.count} candidates</span>
                      <span className="rounded-md bg-[#faf8ef] px-2 py-0.5 font-mono text-[11px] text-[#8a8578]">
                        {step.rate}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-[#faf8ef] overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        idx === 0
                          ? "bg-[#6f7c3d]"
                          : idx === 1
                          ? "bg-[#808e48]"
                          : idx === 2
                          ? "bg-[#91a052]"
                          : idx === 3
                          ? "bg-[#a3b25d]"
                          : "bg-[#b5c468]"
                      )}
                      style={{ width: `${step.count === 0 ? 3 : widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top In-Demand Skills */}
        <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-display text-[20px] text-[#1d1b15]">Top Skills in Demand</h3>
            <Sparkles className="size-4 text-[#6f7c3d]" />
          </div>
          <p className="mt-0.5 text-[12.5px] text-[#8a8578]">Frequency across matched resumes</p>

          <div className="mt-5 flex flex-col gap-2.5">
            {(data?.top_skills || []).length === 0 ? (
              <div className="grid place-items-center py-10 text-center text-[13px] text-[#8a8578]">
                No skills extracted yet. Skills appear as candidates are screened.
              </div>
            ) : (
              data?.top_skills.map((s) => (
                <div
                  key={s.skill}
                  className="flex items-center justify-between rounded-xl border border-[#eeece1] bg-[#faf8ef] px-3.5 py-2"
                >
                  <span className="text-[13px] font-medium text-[#1d1b15]">{s.skill}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-[11.5px] text-[#6f7c3d] shadow-2xs">
                    {s.count} candidates
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
