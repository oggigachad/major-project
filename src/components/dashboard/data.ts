/* ------------------------------------------------------------------ */
/* EvalixAI dashboard — shared types & design tokens                    */
/*                                                                     */
/* NO data lives here: every candidate, job and metric is served by the */
/* FastAPI backend (MongoDB → /api/v1/*). Types + stage styling only.  */
/* ------------------------------------------------------------------ */

export type Stage =
  | "screening"
  | "assessment"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export const STAGE_FLOW: Stage[] = [
  "screening",
  "assessment",
  "interview",
  "offer",
  "hired",
];

export const STAGE_META: Record<Stage, { label: string; chip: string }> = {
  screening: { label: "Screening", chip: "bg-[#f1ecd7] text-[#7a6d2f]" },
  assessment: { label: "Assessment", chip: "bg-[#e9ecd2] text-[#5a662f]" },
  interview: { label: "Interview", chip: "bg-[#dde0b8] text-[#454e1e]" },
  offer: { label: "Offer", chip: "bg-[#6f7c3d] text-[#f4f2ea]" },
  hired: { label: "Hired", chip: "bg-[#1d1b15] text-[#f4f2ea]" },
  rejected: { label: "Rejected", chip: "bg-[#f2e2da] text-[#a15b48]" },
};

export interface InterviewData {
  when: string;
  minutes: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
  quote: string;
}

export interface TaskData {
  title: string;
  passed: number;
  total: number;
  quality: number;
  minutes: number;
  note: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  jobId: string;
  location: string;
  initials: string;
  avatarClass: string;
  appliedDays: number;
  appliedAt: string;
  updated: string;
  stage: Stage;
  match: number;
  scores: { resume: number; assessment: number; interview: number; task: number };
  source: string;
  shortlisted: boolean;
  summary: string;
  matched: string[];
  missing: string[];
  assessmentSections: { label: string; score: number }[];
  interview?: InterviewData;
  task?: TaskData;
}

export interface Job {
  id: string;
  title: string;
  dept: string;
  location: string;
  type: string;
  status: "open" | "paused";
  posted: string;
  pipeline: [number, number, number, number, number];
}

/** Semantic screening result from POST /api/v1/jobs/{id}/screen */
export interface ScreenResult {
  id: string;
  name: string;
  role: string;
  stage: string;
  match: number;
  score: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  tone?: "olive" | "amber" | "error" | "ink";
  read?: boolean;
}

