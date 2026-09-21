"use client";

/* ------------------------------------------------------------------ */
/* Jobs — role cards with live pipeline breakdowns + AI screening      */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin,
  ChevronRight,
  Users,
  Pause,
  Plus,
  Sparkles,
  X,
  Loader2,
  Database,
  ScanSearch,
} from "lucide-react";
import { EASE } from "@/components/landing/shared";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { useDashboard } from "./context";
import { STAGE_FLOW, STAGE_META, type Job, type ScreenResult } from "./data";

const SEGMENT_COLORS = ["#e5e2d2", "#d4d9b4", "#98a465", "#6f7c3d", "#1d1b15"];

/* ------------------------------------------------------------------ */
/* AI screening modal — semantic candidate ranking (Qdrant)            */
/* ------------------------------------------------------------------ */

function ScreenModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const [results, setResults] = useState<ScreenResult[] | null>(null);
  const [engine, setEngine] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/v1/jobs/${job.id}/screen`, { method: "POST" })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Screening failed");
        return r.json();
      })
      .then((d) => {
        if (cancelled) return;
        setResults(d.results ?? []);
        setEngine(d.engine ?? "");
      })
      .catch((e) => !cancelled && setError(e.message ?? "Screening failed"));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKey);
    };
  }, [job.id, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[80] grid place-items-center bg-[#1d1b15]/55 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`AI screening for ${job.title}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] shadow-[0_24px_80px_rgba(29,27,21,0.35)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e5e2d2] p-5">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f7c3d]">
              <Sparkles className="size-3.5" /> AI semantic screening
            </p>
            <h3 className="mt-1 font-serif-display text-[21px] leading-tight text-[#1d1b15]">
              {job.title}
            </h3>
            <p className="mt-0.5 text-[12.5px] text-[#8a8578]">
              Ranked by semantic similarity between the role and every candidate profile
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close screening results"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-[#8a8578] transition-colors hover:bg-[#eeece1] hover:text-[#1d1b15]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5 nota-scroll">
          {error && (
            <div className="rounded-xl border border-[#f2e2da] bg-[#fbf4f1] p-4 text-[13px] text-[#a15b48]">
              {error}
            </div>
          )}
          {!error && results === null && (
            <div className="flex flex-col items-center gap-3 py-12 text-[#8a8578]">
              <Loader2 className="size-6 animate-spin text-[#6f7c3d]" />
              <p className="text-[13.5px]">Embedding candidate profiles…</p>
            </div>
          )}
          {results !== null && results.length === 0 && (
            <div className="grid place-items-center gap-2 py-12 text-center">
              <ScanSearch className="size-6 text-[#8a8578]" />
              <p className="text-[13.5px] text-[#8a8578]">
                No candidates to screen yet — publish the role and let applicants flow in.
              </p>
            </div>
          )}
          <ol className="flex flex-col gap-2.5">
            {results?.map((r, i) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4, ease: EASE }}
                className="flex items-center gap-3.5 rounded-xl border border-[#e5e2d2] p-3.5"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#1d1b15] text-[12px] font-bold text-[#f4f2ea]">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-[#1d1b15]">
                    {r.name}
                  </span>
                  <span className="block truncate text-[12px] capitalize text-[#8a8578]">
                    {r.role} · {r.stage}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-serif-display text-[19px] tabular-nums leading-none text-[#6f7c3d]">
                    {r.score}
                  </span>
                  <span className="block text-[10.5px] uppercase tracking-wide text-[#8a8578]">
                    match {r.match}
                  </span>
                </span>
              </motion.li>
            ))}
          </ol>
        </div>

        <div className="flex items-center justify-between border-t border-[#e5e2d2] bg-[#faf8ef] px-5 py-3">
          <p className="flex items-center gap-1.5 text-[11.5px] text-[#8a8578]">
            <Database className="size-3.5" />
            engine: <span className="font-semibold text-[#55524a]">{engine || "…"}</span>
            {engine === "qdrant" ? " · vector search" : " · lexical fallback"}
          </p>
          <Link
            href="/dashboard/candidates"
            onClick={onClose}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[#6f7c3d] transition-colors hover:text-[#5a662f]"
          >
            Review candidates <ChevronRight className="size-4" />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Jobs page                                                           */
/* ------------------------------------------------------------------ */

export function Jobs() {
  const { jobs, setNewJobOpen, loading } = useDashboard();
  const [screenJob, setScreenJob] = useState<Job | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-[#55524a]">
          <span className="font-serif-display text-[20px] text-[#1d1b15]">{jobs.length}</span> roles ·{" "}
          {jobs.filter((j) => j.status === "open").length} actively screening
        </p>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          onClick={() => setNewJobOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#6f7c3d] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#5a662f]"
        >
          <Plus className="size-4" />
          New job
        </motion.button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-busy="true" aria-label="Loading jobs">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[218px] animate-pulse rounded-2xl border border-[#e5e2d2] bg-[#fffdf7]" />
          ))}
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#d9d5c3] bg-[#fffdf7] py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#eeece1] text-[#8a8578]">
            <Plus className="size-5" />
          </span>
          <div>
            <p className="font-serif-display text-[17px] text-[#1d1b15]">No roles yet</p>
            <p className="mt-1 text-[13px] text-[#8a8578]">
              Publish your first job — EvalixAI starts screening applicants automatically.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {jobs.map((job, ji) => {
          const total = job.pipeline.reduce((a, b) => a + b, 0);
          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: ji * 0.06, ease: EASE }}
              whileHover={{ y: -3 }}
              className="flex flex-col rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-5 transition-shadow hover:shadow-[0_14px_44px_rgba(29,27,21,0.09)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif-display text-[20px] leading-tight text-[#1d1b15]">
                    {job.title}
                  </h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-[#8a8578]">
                    <span className="font-medium text-[#55524a]">{job.dept}</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" /> {job.location}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{job.type}</span>
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
                    job.status === "open"
                      ? "bg-[#e9ecd2] text-[#5a662f]"
                      : "bg-[#f1ecd7] text-[#7a6d2f]"
                  )}
                >
                  {job.status === "paused" && <Pause className="size-3" />}
                  {job.status === "open" ? "Open" : "Paused"}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[13px] text-[#55524a]">
                <Users className="size-4 text-[#8a8578]" />
                <span>
                  <span className="font-semibold tabular-nums text-[#1d1b15]">{total}</span> candidates
                </span>
                <span className="text-[#c2bda9]">·</span>
                <span className="text-[12.5px] text-[#8a8578]">posted {job.posted}</span>
              </div>

              {/* Pipeline segments */}
              <div className="mt-4">
                <div className="flex h-2.5 w-full gap-[3px] overflow-hidden">
                  {job.pipeline.map((count, i) => {
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <span
                        key={i}
                        className="h-full rounded-full"
                        style={{ background: SEGMENT_COLORS[i], width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                        title={`${STAGE_META[STAGE_FLOW[i]].label}: ${count}`}
                      />
                    );
                  })}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                  {job.pipeline.map((count, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-[11.5px] text-[#8a8578]">
                      <span className="size-1.5 rounded-full" style={{ background: SEGMENT_COLORS[i] }} />
                      {STAGE_META[STAGE_FLOW[i]].label}
                      <span className="font-semibold tabular-nums text-[#55524a]">{count}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#e5e2d2] pt-4">
                <p className="text-[12.5px] text-[#8a8578]">
                  {job.pipeline[3]} in offer stage · {job.pipeline[4]} hired
                </p>
                <span className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setScreenJob(job)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6f7c3d] transition-colors hover:text-[#5a662f]"
                  >
                    <Sparkles className="size-3.5" />
                    AI screen
                  </button>
                  <Link
                    href="/dashboard/candidates"
                    aria-label={`Go to candidates for ${job.title}`}
                    className="grid size-7 place-items-center rounded-full text-[#6f7c3d] transition-colors hover:bg-[#dde0b8]"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {screenJob && <ScreenModal job={screenJob} onClose={() => setScreenJob(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
