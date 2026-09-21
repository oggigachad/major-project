"use client";

/* ------------------------------------------------------------------ */
/* Interviews — Candidate-facing AI Voice & Video interview records   */
/* ------------------------------------------------------------------ */

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  Video,
  Search,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Award,
  CheckCircle2,
  Clock,
  PlayCircle,
  Filter,
  X,
  FileText,
  UserCheck,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { EASE } from "@/components/landing/shared";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { ScoreRing } from "./charts";

interface InterviewSession {
  session_id: string;
  candidate_id: string;
  candidate_name?: string;
  role_title?: string;
  status: "READY" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  current_question_index?: number;
  questions?: Array<{ id: string; text: string; topic: string }>;
  transcript?: Array<{ speaker: string; text: string; timestamp: string }>;
  evaluation?: {
    score: number;
    recommendation: string;
    summary: string;
    rubric?: Record<string, number>;
    strengths?: string[];
    improvements?: string[];
  };
  created_at?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; chip: string; icon: React.ComponentType<{ className?: string }> }
> = {
  COMPLETED: {
    label: "Completed",
    chip: "bg-[#eef3db] text-[#4d5724] border border-[#d6e0aa]",
    icon: CheckCircle2,
  },
  IN_PROGRESS: {
    label: "In Progress",
    chip: "bg-[#fef8e7] text-[#916a12] border border-[#fae2a6]",
    icon: PlayCircle,
  },
  READY: {
    label: "Ready to Join",
    chip: "bg-[#eaf4fd] text-[#1e5888] border border-[#c3def8]",
    icon: Clock,
  },
  ABANDONED: {
    label: "Incomplete",
    chip: "bg-[#fbeeed] text-[#932724] border border-[#f5c7c5]",
    icon: X,
  },
};

export function Interviews() {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedScorecard, setSelectedScorecard] = useState<InterviewSession | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/v1/interviews");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.interviews ?? []);
      }
    } catch {
      // API error handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const matchSearch =
        (s.candidate_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (s.role_title?.toLowerCase() || "").includes(search.toLowerCase()) ||
        s.session_id.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filterStatus === "ALL" || s.status === filterStatus;
      return matchSearch && matchFilter;
    });
  }, [sessions, search, filterStatus]);

  // Aggregate stats
  const totalCompleted = sessions.filter((s) => s.status === "COMPLETED").length;
  const inProgressCount = sessions.filter((s) => s.status === "IN_PROGRESS" || s.status === "READY").length;
  const scoredSessions = sessions.filter((s) => s.evaluation?.score);
  const avgScore = scoredSessions.length
    ? Math.round(scoredSessions.reduce((acc, s) => acc + (s.evaluation?.score || 0), 0) / scoredSessions.length)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e5e2d2] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#eef0da] text-[#6f7c3d]">
              <CalendarClock className="size-5" />
            </span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6f7c3d]">
              AI Interview Platform
            </span>
          </div>
          <h2 className="mt-2 font-serif-display text-[28px] leading-tight text-[#1d1b15] sm:text-[32px]">
            Candidate AI Interviews
          </h2>
          <p className="mt-1 text-[14px] text-[#716d63]">
            Real-time interactive voice & video interview sessions with automated rubric evaluation.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSessions}
          className="inline-flex items-center gap-2 rounded-full border border-[#e5e2d2] bg-[#fffdf7] px-4 py-2 text-[13px] font-medium text-[#55524a] shadow-sm transition-colors hover:bg-[#faf8ef]"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#716d63]">Total Sessions</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#faf8ef] text-[#6f7c3d]">
              <Video className="size-4" />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-bold tracking-tight text-[#1d1b15]">{sessions.length}</div>
          <p className="mt-1 text-[12px] text-[#8a8578]">Scheduled and conducted</p>
        </div>

        <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#716d63]">Completed</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#eef3db] text-[#4d5724]">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-bold tracking-tight text-[#1d1b15]">{totalCompleted}</div>
          <p className="mt-1 text-[12px] text-[#8a8578]">Full evaluations generated</p>
        </div>

        <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#716d63]">Active / Ready</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#fef8e7] text-[#916a12]">
              <Clock className="size-4" />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-bold tracking-tight text-[#1d1b15]">{inProgressCount}</div>
          <p className="mt-1 text-[12px] text-[#8a8578]">Ready for candidate entry</p>
        </div>

        <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#716d63]">Average AI Score</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#faf8ef] text-[#6f7c3d]">
              <Award className="size-4" />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-bold tracking-tight text-[#1d1b15]">
            {avgScore > 0 ? `${avgScore}%` : "—"}
          </div>
          <p className="mt-1 text-[12px] text-[#8a8578]">Across scored interviews</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-3 shadow-sm">
        <div className="flex flex-1 items-center gap-2 sm:max-w-xs">
          <Search className="size-4 text-[#8a8578]" />
          <input
            type="text"
            placeholder="Search candidate, role, session..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[13.5px] text-[#1d1b15] placeholder:text-[#8a8578] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {["ALL", "READY", "IN_PROGRESS", "COMPLETED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                filterStatus === st
                  ? "bg-[#2c2a20] text-[#dde0b8]"
                  : "text-[#716d63] hover:bg-[#faf8ef] hover:text-[#1d1b15]"
              )}
            >
              {st === "ALL" ? "All Sessions" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] shadow-sm">
        {filtered.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-[#faf8ef] text-[#8a8578]">
              <Video className="size-7" />
            </div>
            <h3 className="mt-4 font-serif-display text-[20px] text-[#1d1b15]">No interview sessions found</h3>
            <p className="mt-1 max-w-sm text-[13.5px] text-[#716d63]">
              Candidate interview sessions will appear here as candidates advance into the AI interview stage.
            </p>
            <Link
              href="/dashboard/candidates"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#6f7c3d] px-5 py-2.5 text-[13.5px] font-semibold text-[#f4f2ea] shadow-sm hover:bg-[#5a662f]"
            >
              View Candidates
              <ChevronRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-[#e5e2d2] bg-[#faf8ef] text-[11px] uppercase tracking-[0.08em] text-[#8a8578]">
                  <th className="px-5 py-3 font-semibold">Candidate & Session</th>
                  <th className="px-4 py-3 font-semibold">Target Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">AI Evaluation</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeece1]">
                {filtered.map((s) => {
                  const statusInfo = STATUS_CONFIG[s.status] || STATUS_CONFIG.READY;
                  const StatusIcon = statusInfo.icon;
                  const initials = (s.candidate_name || "Candidate")
                    .split(/\s+/)
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr key={s.session_id} className="transition-colors hover:bg-[#faf8ef]/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eef0da] text-[12px] font-bold text-[#5a662f]">
                            {initials}
                          </span>
                          <div>
                            <span className="block font-semibold text-[#1d1b15]">
                              {s.candidate_name || "Anonymous Candidate"}
                            </span>
                            <span className="block font-mono text-[11.5px] text-[#8a8578]">
                              {s.session_id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-[#55524a]">
                        {s.role_title || "Software Engineer"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium",
                            statusInfo.chip
                          )}
                        >
                          <StatusIcon className="size-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {s.evaluation ? (
                          <div className="flex items-center gap-2">
                            <ScoreRing value={s.evaluation.score} size={34} stroke={3} />
                            <div>
                              <span className="block text-[12.5px] font-semibold text-[#1d1b15]">
                                {s.evaluation.recommendation}
                              </span>
                              <span className="block text-[11px] text-[#8a8578]">
                                {s.evaluation.score}/100 Score
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[12px] italic text-[#8a8578]">
                            {s.status === "COMPLETED" ? "Processing score..." : "Pending completion"}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {s.evaluation && (
                            <button
                              type="button"
                              onClick={() => setSelectedScorecard(s)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5e2d2] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#1d1b15] shadow-xs transition-colors hover:bg-[#faf8ef]"
                            >
                              <FileText className="size-3.5 text-[#6f7c3d]" />
                              Scorecard
                            </button>
                          )}
                          <Link
                            href={`/interview/${s.session_id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6f7c3d] px-3 py-1.5 text-[12.5px] font-medium text-white shadow-xs transition-colors hover:bg-[#5a662f]"
                          >
                            <Video className="size-3.5" />
                            {s.status === "COMPLETED" ? "Review Room" : "Join Room"}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scorecard Modal */}
      <AnimatePresence>
        {selectedScorecard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-[#1d1b15]/60 p-4 backdrop-blur-xs"
            onClick={() => setSelectedScorecard(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-6 shadow-xl"
            >
              <div className="flex items-start justify-between border-b border-[#e5e2d2] pb-4">
                <div>
                  <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[#6f7c3d]">
                    <Award className="size-4" /> AI Evaluation Scorecard
                  </div>
                  <h3 className="mt-1 font-serif-display text-[22px] text-[#1d1b15]">
                    {selectedScorecard.candidate_name || "Candidate"} · {selectedScorecard.role_title}
                  </h3>
                  <p className="text-[12.5px] text-[#8a8578]">Session {selectedScorecard.session_id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedScorecard(null)}
                  className="grid size-8 place-items-center rounded-lg text-[#8a8578] hover:bg-[#eeece1]"
                >
                  <X className="size-4" />
                </button>
              </div>

              {selectedScorecard.evaluation && (
                <div className="mt-5 flex flex-col gap-5">
                  <div className="flex items-center gap-4 rounded-xl bg-[#faf8ef] p-4 border border-[#e5e2d2]">
                    <ScoreRing value={selectedScorecard.evaluation.score} size={64} stroke={5} />
                    <div>
                      <div className="text-[12px] font-semibold uppercase tracking-wider text-[#6f7c3d]">
                        Final Recommendation
                      </div>
                      <div className="text-[20px] font-bold text-[#1d1b15]">
                        {selectedScorecard.evaluation.recommendation}
                      </div>
                      <div className="text-[12.5px] text-[#716d63]">
                        Aggregated from answer quality, problem solving, and communication depth.
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[13.5px] font-semibold text-[#1d1b15]">Executive Summary</h4>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#55524a]">
                      {selectedScorecard.evaluation.summary}
                    </p>
                  </div>

                  {selectedScorecard.evaluation.rubric && (
                    <div>
                      <h4 className="text-[13.5px] font-semibold text-[#1d1b15]">Competency Breakdown</h4>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        {Object.entries(selectedScorecard.evaluation.rubric).map(([k, v]) => (
                          <div key={k} className="rounded-xl border border-[#e5e2d2] bg-white p-3">
                            <div className="flex items-center justify-between text-[12px]">
                              <span className="capitalize font-medium text-[#716d63]">{k.replace("_", " ")}</span>
                              <span className="font-bold text-[#1d1b15]">{v}/100</span>
                            </div>
                            <div className="mt-2 h-1.5 w-full rounded-full bg-[#eeece1] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#6f7c3d]"
                                style={{ width: `${Math.min(100, Math.max(0, v))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedScorecard.transcript && selectedScorecard.transcript.length > 0 && (
                    <div className="border-t border-[#e5e2d2] pt-4">
                      <h4 className="text-[13.5px] font-semibold text-[#1d1b15]">Interview Transcript Sample</h4>
                      <div className="mt-2 flex max-h-48 flex-col gap-2 overflow-y-auto rounded-xl bg-[#faf8ef] p-3 text-[12.5px]">
                        {selectedScorecard.transcript.map((t, idx) => (
                          <div key={idx} className="flex flex-col">
                            <span className="font-bold text-[#6f7c3d]">
                              {t.speaker === "ai" ? "AI Interviewer" : "Candidate"}:
                            </span>
                            <span className="text-[#33312b]">{t.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
