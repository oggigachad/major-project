"use client";

/* ------------------------------------------------------------------ */
/* Candidate Proctored Coding Assessment Room                         */
/* Integrates Judge0 execution, LeetCode UI, and AI camera proctoring */
/* ------------------------------------------------------------------ */

import { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import {
  Code2,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Camera,
  CameraOff,
  Maximize2,
  Terminal,
  Send,
  Loader2,
  ChevronLeft,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { EvalixLogo } from "@/components/landing/shared";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

interface ChallengeData {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  description: string;
  starter_code: Record<string, string>;
  sample_test_cases: Array<{ id: number; stdin: string; expected_output: string }>;
}

interface AssessmentData {
  assessment_id: string;
  candidate_id: string;
  candidate_name: string;
  role: string;
  status: "IN_PROGRESS" | "PASSED" | "FAILED";
  pass_percentage: number;
}

export default function AssessmentRoomPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = use(params);

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [language, setLanguage] = useState<string>("python");
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<any | null>(null);
  const [submissionOutcome, setSubmissionOutcome] = useState<any | null>(null);

  // Proctoring states
  const [cameraActive, setCameraActive] = useState(false);
  const [proctorWarning, setProctorWarning] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Fetch Assessment & Challenge
  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/v1/assessments/${assessmentId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.assessment && data.challenge) {
          setAssessment(data.assessment);
          setChallenge(data.challenge);
          setCode(data.challenge.starter_code[language] || data.challenge.starter_code.python);
        }
      })
      .catch((e) => console.error("Failed to load assessment:", e))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [assessmentId, language]);

  // 2. Camera Setup for AI Vision Proctoring
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } catch (err) {
        console.warn("Camera permission denied or unavailable:", err);
        setCameraActive(false);
      }
    }
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 3. Focus & Tab-Switch Tracking
  useEffect(() => {
    const handleViolation = async (type: string, detail: string) => {
      setViolationCount((c) => c + 1);
      setProctorWarning(`Security Alert: ${detail}`);
      setTimeout(() => setProctorWarning(null), 6000);

      // Capture webcam frame if available
      let snapshotB64: string | undefined = undefined;
      if (videoRef.current && cameraActive) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 320, 240);
            snapshotB64 = canvas.toDataURL("image/jpeg", 0.7);
          }
        } catch {}
      }

      try {
        await apiFetch(`/api/v1/assessments/${assessmentId}/proctor-event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            detail,
            snapshot_base64: snapshotB64,
          }),
        });
      } catch {}
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("tab_switch", "Tab switched or minimized during examination");
      }
    };

    const onBlur = () => {
      handleViolation("window_blur", "Candidate navigated away from assessment window");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [assessmentId, cameraActive]);

  // 4. Run Sample Tests
  const handleRun = async () => {
    try {
      setRunning(true);
      setTestResults(null);
      const res = await apiFetch(`/api/v1/assessments/${assessmentId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: code, language }),
      });
      if (res.ok) {
        const json = await res.json();
        setTestResults(json.test_run);
      }
    } catch {
      // Handled
    } finally {
      setRunning(false);
    }
  };

  // 5. Submit Final Code
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const res = await apiFetch(`/api/v1/assessments/${assessmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: code, language }),
      });
      if (res.ok) {
        const json = await res.json();
        setSubmissionOutcome(json);
        setTestResults(json.evaluation);
        if (json.assessment) {
          setAssessment(json.assessment);
        }
      }
    } catch {
      // Handled
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8ef]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#6f7c3d]" />
          <p className="text-[13.5px] font-medium text-[#716d63]">Loading assessment environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#f4f2ea] text-[#1d1b15]">
      {/* Top Navbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#e5e2d2] bg-[#fffdf7] px-6">
        <div className="flex items-center gap-4">
          <EvalixLogo />
          <div className="h-4 w-px bg-[#e5e2d2]" />
          <div className="flex items-center gap-2 text-[13px]">
            <span className="font-semibold text-[#1d1b15]">{challenge?.title || "Coding Challenge"}</span>
            <span className="rounded-full bg-[#eef0da] px-2 py-0.5 text-[11px] font-semibold text-[#5a662f]">
              {challenge?.difficulty || "Medium"}
            </span>
          </div>
        </div>

        {/* Proctoring Status Pill */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium border",
              violationCount > 0
                ? "bg-[#fbeeed] text-[#932724] border-[#f5c7c5]"
                : "bg-[#eef3db] text-[#4d5724] border-[#d6e0aa]"
            )}
          >
            {violationCount > 0 ? <ShieldAlert className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
            <span>{violationCount > 0 ? `${violationCount} Integrity Warnings` : "AI Proctoring Active"}</span>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e2d2] px-3 py-1.5 text-[12px] font-medium text-[#716d63] hover:bg-[#faf8ef]"
          >
            <ChevronLeft className="size-3.5" />
            Dashboard
          </Link>
        </div>
      </header>

      {/* Proctoring Banner Warning */}
      {proctorWarning && (
        <div className="flex items-center justify-center gap-2 bg-[#932724] px-4 py-2 text-[12.5px] font-semibold text-white shadow-sm">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{proctorWarning}</span>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Problem Statement Panel */}
        <div className="w-1/2 overflow-y-auto border-r border-[#e5e2d2] bg-[#fffdf7] p-6">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#6f7c3d]">
              {challenge?.category || "Algorithmic Assessment"}
            </span>
            <span className="font-mono text-[11.5px] text-[#8a8578]">Session {assessmentId}</span>
          </div>

          <h1 className="mt-2 font-serif-display text-[26px] text-[#1d1b15]">{challenge?.title}</h1>

          <div className="prose prose-sm mt-4 text-[13.5px] leading-relaxed text-[#444139]">
            <p className="whitespace-pre-line">{challenge?.description}</p>
          </div>

          {/* Sample Test Cases Preview */}
          <div className="mt-8 border-t border-[#eeece1] pt-5">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#716d63]">Sample Test Cases</h3>
            <div className="mt-3 flex flex-col gap-3">
              {(challenge?.sample_test_cases || []).map((tc, idx) => (
                <div key={tc.id} className="rounded-xl border border-[#eeece1] bg-[#faf8ef] p-3 text-[12.5px]">
                  <div className="font-semibold text-[#6f7c3d]">Test Case {idx + 1}</div>
                  <div className="mt-1 font-mono text-[#55524a]">
                    <span className="text-[#8a8578]">Input:</span> {tc.stdin.replace("\n", ", ")}
                  </div>
                  <div className="font-mono text-[#1d1b15]">
                    <span className="text-[#8a8578]">Expected:</span> {tc.expected_output}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Code Editor & Runner Panel */}
        <div className="flex w-1/2 flex-col bg-[#1d1b15]">
          {/* Editor Header Toolbar */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 px-4">
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => {
                  const l = e.target.value;
                  setLanguage(l);
                  if (challenge?.starter_code[l]) {
                    setCode(challenge.starter_code[l]);
                  }
                }}
                className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[12px] font-medium text-[#f4f2ea] focus:outline-none"
              >
                <option value="python" className="bg-[#1d1b15]">
                  Python 3
                </option>
                <option value="javascript" className="bg-[#1d1b15]">
                  JavaScript (Node.js)
                </option>
              </select>
              <span className="text-[11px] font-mono text-[#8a8578]">Judge0 Sandbox</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={running || submitting}
                onClick={handleRun}
                className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-[12px] font-medium text-[#f4f2ea] transition-colors hover:bg-white/15 disabled:opacity-50"
              >
                {running ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3 text-[#dde0b8]" />}
                Run Code
              </button>

              <button
                type="button"
                disabled={running || submitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#6f7c3d] px-3 py-1.5 text-[12px] font-semibold text-[#f4f2ea] transition-colors hover:bg-[#5a662f] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                Submit Assessment
              </button>
            </div>
          </div>

          {/* Code Textarea Area */}
          <div className="relative flex-1">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="h-full w-full resize-none bg-[#1d1b15] p-4 font-mono text-[13px] leading-relaxed text-[#e5e2d2] focus:outline-none"
              placeholder="// Write your solution here..."
            />
          </div>

          {/* Test Runner Console */}
          <div className="h-44 border-t border-white/10 bg-[#14130f] p-3 text-[12.5px] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[11px] uppercase tracking-wider text-[#8a8578]">
              <div className="flex items-center gap-1.5">
                <Terminal className="size-3.5" />
                Execution Console
              </div>
              {testResults && (
                <span
                  className={cn(
                    "font-bold",
                    testResults.all_passed ? "text-[#a3b25d]" : "text-[#f5c7c5]"
                  )}
                >
                  {testResults.passed_count}/{testResults.total_test_cases} Test Cases Passed ({testResults.pass_percentage}%)
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-col gap-2 font-mono">
              {!testResults ? (
                <div className="text-[#8a8578] italic">
                  Click &quot;Run Code&quot; to test your solution against sample inputs.
                </div>
              ) : (
                testResults.results?.map((r: any) => (
                  <div
                    key={r.test_case_id}
                    className={cn(
                      "rounded-md border p-2",
                      r.passed
                        ? "border-[#4d5724]/40 bg-[#4d5724]/10 text-[#dde0b8]"
                        : "border-[#932724]/40 bg-[#932724]/10 text-[#f5c7c5]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Case {r.test_case_id}: {r.passed ? "Passed" : "Failed"}</span>
                      <span className="text-[11px] opacity-75">{r.execution_time_ms}ms</span>
                    </div>
                    {!r.passed && (
                      <div className="mt-1 text-[11.5px] opacity-90">
                        <div>Expected: {r.expected_output}</div>
                        <div>Got: {r.actual_output || r.error || "(no output)"}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Webcam Proctoring Box */}
      <div className="fixed bottom-4 right-4 z-50 overflow-hidden rounded-xl border border-[#e5e2d2] bg-[#1d1b15] shadow-2xl">
        <div className="relative h-28 w-36">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-[#1d1b15]/80 px-2 py-0.5 text-[10px] font-semibold text-[#dde0b8]">
            <div className="size-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </div>
        </div>
      </div>
    </div>
  );
}
