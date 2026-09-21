"use client";

/* ------------------------------------------------------------------ */
/* Dashboard context — shared state, real-time WebSocket & actions    */
/*                                                                     */
/* 100% dynamic & API-driven: candidates, jobs, stats, insights and   */
/* live notifications are synchronized in real time via WebSockets.   */
/* Zero hard-coded demo data — all updates broadcast to all clients.  */
/* ------------------------------------------------------------------ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, Undo2 } from "lucide-react";
import { EASE } from "@/components/landing/shared";
import { cn } from "@/lib/utils";
import { apiFetch, wsUrl } from "@/lib/api-client";
import {
  STAGE_FLOW,
  type Candidate,
  type Job,
  type NotificationItem,
  type Stage,
} from "./data";

/* ------------------------------ types ------------------------------ */

export interface DashboardStats {
  kpis: {
    activeJobs: number;
    totalCandidates: number;
    assessmentRate: number;
    avgMatch: number;
  };
  flow: { labels: string[]; applied: number[]; shortlisted: number[] };
  funnel: { label: string; value: number }[];
  insights: { tone: "olive" | "amber" | "ink"; text: string }[];
  upcoming: { id: string; name: string; role: string; when: string; readiness: number }[];
}

export interface DashUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLoginAt?: string | null;
}

interface ToastAction {
  label: string;
  run: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  tone: "success" | "info" | "error";
  action?: ToastAction;
}

export interface DashboardValue {
  candidates: Candidate[];
  jobs: Job[];
  stats: DashboardStats | null;
  user: DashUser | null;
  loading: boolean;
  hydrated: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  newJobOpen: boolean;
  setNewJobOpen: (open: boolean) => void;
  newCandidateOpen: boolean;
  setNewCandidateOpen: (open: boolean) => void;
  toast: (message: string, opts?: { tone?: ToastItem["tone"]; action?: ToastAction }) => void;
  advanceStage: (id: string) => void;
  rejectCandidate: (id: string) => void;
  toggleShortlist: (id: string) => void;
  addJob: (job: Omit<Job, "id" | "status" | "posted" | "pipeline">) => Promise<boolean>;
  addCandidate: (cand: {
    name: string;
    email: string;
    role: string;
    job_id?: string;
    location?: string;
    summary?: string;
    matched?: string[];
    missing?: string[];
  }) => Promise<boolean>;
  generateInsight: () => Promise<void>;
  wsStatus: "connecting" | "connected" | "disconnected";
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationsRead: () => void;
  clearNotifications: () => void;
}

const DashboardContext = createContext<DashboardValue | null>(null);

const TONE_ICON = {
  success: CheckCircle2,
  info: Info,
  error: AlertTriangle,
} as const;

const JSON_HEADERS = { "Content-Type": "application/json" };

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<DashUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [newCandidateOpen, setNewCandidateOpen] = useState(false);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const toastId = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);

  const toast = useCallback<DashboardValue["toast"]>((message, opts) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, message, tone: opts?.tone ?? "success", action: opts?.action }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const refreshStats = useCallback(() => {
    apiFetch("/api/v1/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setStats(s))
      .catch(() => {});
  }, []);

  /* ---------------------- WebSocket connection ---------------------- */
  useEffect(() => {
    let unmounted = false;

    function connectWs() {
      if (unmounted) return;
      const url = wsUrl("/api/v1/ws");
      if (!url) return;

      setWsStatus("connecting");
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (unmounted) {
            ws.close();
            return;
          }
          reconnectAttempts.current = 0;
          setWsStatus("connected");
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const data = JSON.parse(event.data);
            const { type, data: payload } = data;

            switch (type) {
              case "candidate:updated":
                if (payload && payload.id) {
                  setCandidates((list) =>
                    list.map((c) => (c.id === payload.id ? { ...c, ...payload } : c))
                  );
                }
                break;

              case "candidate:created":
                if (payload && payload.id) {
                  setCandidates((list) => [
                    payload,
                    ...list.filter((c) => c.id !== payload.id),
                  ]);
                }
                break;

              case "job:created":
                if (payload && payload.id) {
                  setJobs((list) => [
                    payload,
                    ...list.filter((j) => j.id !== payload.id),
                  ]);
                }
                break;

              case "stats:updated":
                if (payload) {
                  setStats(payload);
                }
                break;

              case "insight:new":
                if (payload && payload.text) {
                  setStats((s) =>
                    s
                      ? {
                          ...s,
                          insights: [payload, ...s.insights.slice(0, 4)],
                        }
                      : null
                  );
                }
                break;

              case "notification:new":
                if (payload) {
                  setNotifications((prev) => [
                    {
                      id: payload.id || `notif-${Date.now()}`,
                      title: payload.title || "Pipeline Update",
                      message: payload.message || "",
                      time: payload.time || "just now",
                      tone: payload.tone || "olive",
                      read: false,
                    },
                    ...prev.slice(0, 49),
                  ]);
                  setUnreadCount((c) => c + 1);
                  toast(payload.message, {
                    tone: payload.tone === "error" ? "error" : "info",
                  });
                }
                break;

              default:
                break;
            }
          } catch {
            /* ignore malformed payload */
          }
        };

        ws.onclose = () => {
          if (unmounted) return;
          setWsStatus("disconnected");
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = window.setTimeout(connectWs, delay);
        };

        ws.onerror = () => {
          if (unmounted) return;
          setWsStatus("disconnected");
          ws.close();
        };
      } catch {
        setWsStatus("disconnected");
      }
    }

    connectWs();

    // Heartbeat ping interval
    const pingTimer = window.setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);

    return () => {
      unmounted = true;
      clearInterval(pingTimer);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [toast]);

  /* Initial load from the backend */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await apiFetch("/api/v1/auth/refresh", { method: "POST" });
        if (cancelled) return;
        if (r.status === 401) {
          router.replace("/login");
          return;
        }
        if (r.ok) {
          const d = await r.json().catch(() => null);
          if (d?.user) setUser(d.user);
        }

        const [cRes, jRes, sRes] = await Promise.all([
          apiFetch("/api/v1/candidates"),
          apiFetch("/api/v1/jobs"),
          apiFetch("/api/v1/stats"),
        ]);
        if (cancelled) return;
        const [cData, jData, sData] = await Promise.all([
          cRes.ok ? cRes.json() : null,
          jRes.ok ? jRes.json() : null,
          sRes.ok ? sRes.json() : null,
        ]);
        if (cancelled) return;
        if (cData?.candidates) setCandidates(cData.candidates);
        if (jData?.jobs) setJobs(jData.jobs);
        if (sData) setStats(sData);
        if (!cRes.ok && cRes.status === 401) {
          router.replace("/login");
          return;
        }
      } catch {
        toast("Could not reach the EvalixAI API — is the backend running?", { tone: "error" });
      } finally {
        if (!cancelled) {
          setHydrated(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, toast]);

  /* -------------------------- actions -------------------------- */

  const applyServerCandidate = useCallback((c: Candidate) => {
    setCandidates((list) => list.map((x) => (x.id === c.id ? c : x)));
  }, []);

  const restoreCandidate = useCallback(
    (id: string) => {
      apiFetch(`/api/v1/candidates/${id}/stage`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ action: "restore" }),
      })
        .then(async (r) => {
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Restore failed");
          return r.json();
        })
        .then((d) => {
          applyServerCandidate(d.candidate);
          refreshStats();
        })
        .catch(() => toast("Could not restore the candidate.", { tone: "error" }));
    },
    [applyServerCandidate, refreshStats, toast]
  );

  const advanceStage = useCallback(
    (id: string) => {
      let snapshot: Candidate[] = [];
      setCandidates((list) => {
        snapshot = list;
        const c = list.find((x) => x.id === id);
        if (!c) return list;
        if (c.stage === "rejected") {
          toast(`${c.name} was rejected — restore them first to move forward.`, { tone: "error" });
          return list;
        }
        const idx = STAGE_FLOW.indexOf(c.stage);
        if (idx === -1 || idx === STAGE_FLOW.length - 1) {
          toast(`${c.name} is already hired. 🎉`, { tone: "info" });
          return list;
        }
        const next = STAGE_FLOW[idx + 1];
        toast(`${c.name} moved to ${next[0].toUpperCase() + next.slice(1)}`);
        return list.map((x) =>
          x.id === id ? { ...x, stage: next as Stage, updated: "just now" } : x
        );
      });
      apiFetch(`/api/v1/candidates/${id}/stage`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ action: "advance" }),
      })
        .then(async (r) => {
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Update failed");
          return r.json();
        })
        .then((d) => {
          if (d.candidate) applyServerCandidate(d.candidate);
          refreshStats();
        })
        .catch(() => {
          setCandidates(snapshot);
          toast("Could not update the stage — change reverted.", { tone: "error" });
        });
    },
    [applyServerCandidate, refreshStats, toast]
  );

  const rejectCandidate = useCallback(
    (id: string) => {
      let snapshot: Candidate[] = [];
      setCandidates((list) => {
        snapshot = list;
        const c = list.find((x) => x.id === id);
        if (!c || c.stage === "rejected") return list;
        toast(`${c.name} rejected`, {
          tone: "error",
          action: { label: "Undo", run: () => restoreCandidate(id) },
        });
        return list.map((x) =>
          x.id === id ? { ...x, stage: "rejected" as Stage, updated: "just now" } : x
        );
      });
      apiFetch(`/api/v1/candidates/${id}/stage`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ action: "reject" }),
      })
        .then(async (r) => {
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Update failed");
          return r.json();
        })
        .then((d) => {
          if (d.candidate) applyServerCandidate(d.candidate);
          refreshStats();
        })
        .catch(() => {
          setCandidates(snapshot);
          toast("Could not reject the candidate — change reverted.", { tone: "error" });
        });
    },
    [applyServerCandidate, refreshStats, restoreCandidate, toast]
  );

  const toggleShortlist = useCallback(
    (id: string) => {
      let next = false;
      setCandidates((list) => {
        const c = list.find((x) => x.id === id);
        if (!c) return list;
        next = !c.shortlisted;
        toast(next ? `${c.name} added to shortlist` : `${c.name} removed from shortlist`, {
          tone: "info",
        });
        return list.map((x) => (x.id === id ? { ...x, shortlisted: next } : x));
      });
      apiFetch(`/api/v1/candidates/${id}`, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ shortlisted: next }),
      })
        .then(async (r) => {
          if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Update failed");
          return r.json();
        })
        .then((d) => {
          if (d.candidate) applyServerCandidate(d.candidate);
          refreshStats();
        })
        .catch(() => toast("Could not update the shortlist.", { tone: "error" }));
    },
    [applyServerCandidate, refreshStats, toast]
  );

  const addJob = useCallback<DashboardValue["addJob"]>(
    async (job) => {
      try {
        const r = await apiFetch("/api/v1/jobs", {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify(job),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          toast(data.error ?? "Could not publish the job.", { tone: "error" });
          return false;
        }
        setJobs((list) => [data.job, ...list.filter((j) => j.id !== data.job.id)]);
        toast(`"${job.title}" published — EvalixAI started screening applicants`);
        refreshStats();
        return true;
      } catch {
        toast("Network error — could not publish the job.", { tone: "error" });
        return false;
      }
    },
    [refreshStats, toast]
  );

  const addCandidate = useCallback<DashboardValue["addCandidate"]>(
    async (cand) => {
      try {
        const r = await apiFetch("/api/v1/candidates", {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify(cand),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          toast(data.error ?? "Could not ingest candidate.", { tone: "error" });
          return false;
        }
        setCandidates((list) => [data.candidate, ...list.filter((c) => c.id !== data.candidate.id)]);
        toast(`Candidate ${cand.name} added to pipeline`);
        refreshStats();
        return true;
      } catch {
        toast("Network error — could not add candidate.", { tone: "error" });
        return false;
      }
    },
    [refreshStats, toast]
  );

  const generateInsight = useCallback(async () => {
    try {
      const r = await apiFetch("/api/v1/stats/insights/generate", {
        method: "POST",
        headers: JSON_HEADERS,
      });
      if (r.ok) {
        const d = await r.json().catch(() => null);
        if (d?.stats) setStats(d.stats);
        toast("AI insights generated from live pipeline data", { tone: "info" });
      }
    } catch {
      toast("Could not refresh AI insights.", { tone: "error" });
    }
  }, [toast]);

  const markNotificationsRead = useCallback(() => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const value = useMemo<DashboardValue>(
    () => ({
      candidates,
      jobs,
      stats,
      user,
      loading,
      hydrated,
      searchQuery,
      setSearchQuery,
      newJobOpen,
      setNewJobOpen,
      newCandidateOpen,
      setNewCandidateOpen,
      toast,
      advanceStage,
      rejectCandidate,
      toggleShortlist,
      addJob,
      addCandidate,
      generateInsight,
      wsStatus,
      notifications,
      unreadCount,
      markNotificationsRead,
      clearNotifications,
    }),
    [
      candidates,
      jobs,
      stats,
      user,
      loading,
      hydrated,
      searchQuery,
      newJobOpen,
      newCandidateOpen,
      toast,
      advanceStage,
      rejectCandidate,
      toggleShortlist,
      addJob,
      addCandidate,
      generateInsight,
      wsStatus,
      notifications,
      unreadCount,
      markNotificationsRead,
      clearNotifications,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
      {/* Toaster */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[calc(100vw-40px)] max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = (t.tone && (TONE_ICON as any)[t.tone]) ? (TONE_ICON as any)[t.tone] : Info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="pointer-events-auto flex items-center gap-3 rounded-xl border border-[#e5e2d2] bg-[#fffdf7] px-4 py-3 shadow-[0_10px_36px_rgba(29,27,21,0.16)]"
              >
                <Icon
                  className={cn(
                    "size-[18px] shrink-0",
                    t.tone === "success" && "text-[#6f7c3d]",
                    t.tone === "info" && "text-[#8a8578]",
                    t.tone === "error" && "text-[#a15b48]"
                  )}
                />
                <p className="flex-1 text-[13.5px] leading-snug text-[#1d1b15]">{t.message}</p>
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.run();
                      setToasts((list) => list.filter((x) => x.id !== t.id));
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f4f2ea] px-2.5 py-1 text-xs font-semibold text-[#55524a] transition-colors hover:bg-[#dde0b8] hover:text-[#454e1e]"
                  >
                    <Undo2 className="size-3" />
                    {t.action.label}
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside <DashboardProvider>");
  return ctx;
}
