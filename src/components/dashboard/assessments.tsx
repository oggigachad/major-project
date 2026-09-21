"use client";

/* ------------------------------------------------------------------ */
/* Assessments — Technical coding challenges & AI proctoring audits    */
/* ------------------------------------------------------------------ */

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Code2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  AlertTriangle,
  Play,
  Terminal,
  ExternalLink,
  ChevronRight,
  X,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { ScoreRing } from "./charts";

interface AssessmentRecord {
  assessment_id: string;
  candidate_id: string;
  candidate_name: string;
  role: string;
  challenge_id: string;
  challenge_title: string;
  difficulty: string;
  status: "IN_PROGRESS" | "PASSED" | "FAILED";
  language: string;
  submitted_code?: string;
  pass_percentage: number;
  proctoring_violations?: Array<{
    id: string;
    type: string;
    detail: string;
    evidence_url?: string;
    timestamp: string;
  }>;
  proctoring_risk?: {
    risk_score: number;
    risk_level: "LOW" | "MEDIUM" | "HIGH";
    total_violations: number;
  };
  created_at: string;
  submitted_at?: string;
}

export function Assessments() {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedSubmission, setSelectedSubmission] = useState<AssessmentRecord | null>(null);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/v1/assessments");
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments ?? []);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const filtered = useMemo(() => {
    return assessments.filter((a) => {
      const matchSearch =
        a.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
        a.challenge_title.toLowerCase().includes(search.toLowerCase()) ||
        a.assessment_id.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filterStatus === "ALL" || a.status === filterStatus;
      return matchSearch && matchFilter;
    });
  }, [assessments, search, filterStatus]);

  const passedCount = assessments.filter((a) => a.status === "PASSED").length;
  const inProgressCount = assessments.filter((a) => a.status === "IN_PROGRESS").length;
  const highRiskCount = assessments.filter((a) => a.proctoring_risk?.risk_level === "HIGH").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e5e2d2] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#eef0da] text-[#6f7c3d]">
              <Code2 className="size-5" />
            </span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6f7c3d]">
              Sandboxed Code Assessment & Proctoring
            </span>
          </div>
          <h2 className="mt-2 font-serif-display text-[28px] leading-tight text-[#1d1b15] sm:text-[32px]">
            Technical Coding Assessments
          </h2>
          <p className="mt-1 text-[14px] text-[#716d63]">
            Sandboxed algorithmic test execution (Judge0 API) paired with real-time AI focus & proctoring integrity audits.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAssessments}
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
            <span className="text-[13px] font-medium text-[#716d63]">Total Assessments</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#faf8ef] text-[#6f7c3d]">
              <FileCode className="size-4" />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-bold tracking-tight text-[#1d1b15]">{assessments.length}</div>
          <p className="mt-1 text-[12px] text-[#8a8578]">Initialized or completed</p>
        </div>

        <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#716d63]">Tests Passed</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#eef3db] text-[#4d5724]">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-bold tracking-tight text-[#1d1b15]">{passedCount}</div>
          <p className="mt-1 text-[12px] text-[#8a8578]">100% test cases cleared</p>
        </div>

        <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#716d63]">Active / In Progress</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#fef8e7] text-[#916a12]">
              <Clock className="size-4" />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-bold tracking-tight text-[#1d1b15]">{inProgressCount}</div>
          <p className="mt-1 text-[12px] text-[#8a8578]">Candidate currently coding</p>
        </div>

        <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#716d63]">Proctoring Alerts</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#fbeeed] text-[#932724]">
              <AlertTriangle className="size-4" />
            </span>
          </div>
          <div className="mt-3 text-[32px] font-bold tracking-tight text-[#1d1b15]">{highRiskCount}</div>
          <p className="mt-1 text-[12px] text-[#8a8578]">Flagged for recruiter review</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-3 shadow-sm">
        <div className="flex flex-1 items-center gap-2 sm:max-w-xs">
          <Search className="size-4 text-[#8a8578]" />
          <input
            type="text"
            placeholder="Search candidate, problem, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[13.5px] text-[#1d1b15] placeholder:text-[#8a8578] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {["ALL", "IN_PROGRESS", "PASSED", "FAILED"].map((st) => (
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
              {st === "ALL" ? "All Submissions" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Assessments Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] shadow-sm">
        {filtered.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-[#faf8ef] text-[#8a8578]">
              <Code2 className="size-7" />
            </div>
            <h3 className="mt-4 font-serif-display text-[20px] text-[#1d1b15]">No technical assessments found</h3>
            <p className="mt-1 max-w-sm text-[13.5px] text-[#716d63]">
              Candidates advance to technical coding assessments after passing initial AI resume screening.
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
                  <th className="px-5 py-3 font-semibold">Candidate</th>
                  <th className="px-4 py-3 font-semibold">Challenge</th>
                  <th className="px-4 py-3 font-semibold">Execution Status</th>
                  <th className="px-4 py-3 font-semibold">Proctoring Risk</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeece1]">
                {filtered.map((a) => {
                  const risk = a.proctoring_risk || { risk_score: 0, risk_level: "LOW" };
                  return (
                    <tr key={a.assessment_id} className="transition-colors hover:bg-[#faf8ef]/70">
                      <td className="px-5 py-4">
                        <span className="block font-semibold text-[#1d1b15]">{a.candidate_name}</span>
                        <span className="block font-mono text-[11.5px] text-[#8a8578]">{a.assessment_id}</span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="block font-medium text-[#1d1b15]">{a.challenge_title}</span>
                        <span className="inline-block rounded-md bg-[#faf8ef] px-2 py-0.5 text-[11px] font-medium text-[#6f7c3d]">
                          {a.difficulty}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {a.status === "PASSED" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef3db] px-2.5 py-1 text-[11.5px] font-semibold text-[#4d5724] border border-[#d6e0aa]">
                            <CheckCircle2 className="size-3.5" /> Passed ({a.pass_percentage}%)
                          </span>
                        ) : a.status === "FAILED" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbeeed] px-2.5 py-1 text-[11.5px] font-semibold text-[#932724] border border-[#f5c7c5]">
                            <XCircle className="size-3.5" /> Failed ({a.pass_percentage}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef8e7] px-2.5 py-1 text-[11.5px] font-semibold text-[#916a12] border border-[#fae2a6]">
                            <Clock className="size-3.5" /> In Progress
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
                            risk.risk_level === "HIGH"
                              ? "bg-[#fbeeed] text-[#932724] border border-[#f5c7c5]"
                              : risk.risk_level === "MEDIUM"
                              ? "bg-[#fef8e7] text-[#916a12] border border-[#fae2a6]"
                              : "bg-[#eef3db] text-[#4d5724] border border-[#d6e0aa]"
                          )}
                        >
                          {risk.risk_level === "HIGH" ? (
                            <ShieldAlert className="size-3.5" />
                          ) : (
                            <ShieldCheck className="size-3.5" />
                          )}
                          {risk.risk_level} Risk ({risk.risk_score}%)
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSubmission(a)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5e2d2] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#1d1b15] shadow-xs hover:bg-[#faf8ef]"
                          >
                            <Terminal className="size-3.5 text-[#6f7c3d]" />
                            Inspect
                          </button>
                          <Link
                            href={`/assessment/${a.assessment_id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6f7c3d] px-3 py-1.5 text-[12.5px] font-medium text-white shadow-xs hover:bg-[#5a662f]"
                          >
                            <Play className="size-3.5" />
                            Open Room
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

      {/* Code Inspector & Proctoring Audit Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-[#1d1b15]/60 p-4 backdrop-blur-xs"
            onClick={() => setSelectedSubmission(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-6 shadow-xl"
            >
              <div className="flex items-start justify-between border-b border-[#e5e2d2] pb-4">
                <div>
                  <div className="flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[#6f7c3d]">
                    <Terminal className="size-4" /> Code Submission & Proctoring Audit
                  </div>
                  <h3 className="mt-1 font-serif-display text-[22px] text-[#1d1b15]">
                    {selectedSubmission.candidate_name} · {selectedSubmission.challenge_title}
                  </h3>
                  <p className="text-[12.5px] text-[#8a8578]">Assessment ID: {selectedSubmission.assessment_id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="grid size-8 place-items-center rounded-lg text-[#8a8578] hover:bg-[#eeece1]"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Code Snippet */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-[12.5px] font-medium text-[#55524a]">
                  <span>Submitted Source Code ({selectedSubmission.language})</span>
                  <span className="font-mono text-[11.5px] text-[#8a8578]">Judge0 Engine</span>
                </div>
                <pre className="mt-2 max-h-56 overflow-auto rounded-xl bg-[#1d1b15] p-4 font-mono text-[12.5px] text-[#e5e2d2]">
                  {selectedSubmission.submitted_code || "# No code submitted yet"}
                </pre>
              </div>

              {/* Proctoring Violations Log */}
              <div className="mt-6 border-t border-[#e5e2d2] pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-semibold text-[#1d1b15]">Proctoring Audit Trail (MinIO Evidence)</h4>
                  <span className="text-[12px] text-[#8a8578]">
                    {selectedSubmission.proctoring_violations?.length || 0} telemetry alerts recorded
                  </span>
                </div>

                <div className="mt-3 flex max-h-48 flex-col gap-2 overflow-y-auto">
                  {(selectedSubmission.proctoring_violations || []).length === 0 ? (
                    <div className="rounded-xl bg-[#eef3db] p-3 text-center text-[12.5px] font-medium text-[#4d5724]">
                      No focus violations or integrity anomalies detected during this session.
                    </div>
                  ) : (
                    selectedSubmission.proctoring_violations?.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between rounded-xl border border-[#eeece1] bg-[#faf8ef] p-3 text-[12.5px]"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="size-4 text-[#d9a45b]" />
                          <div>
                            <span className="font-semibold capitalize text-[#1d1b15]">{v.type.replace("_", " ")}</span>
                            <span className="ml-2 text-[#716d63]">{v.detail}</span>
                          </div>
                        </div>
                        {v.evidence_url && (
                          <a
                            href={v.evidence_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11.5px] font-medium text-[#6f7c3d] shadow-2xs hover:bg-[#eeece1]"
                          >
                            <Eye className="size-3" /> View Snapshot
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
