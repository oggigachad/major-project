"use client";

/* ------------------------------------------------------------------ */
/* Dashboard shell — sidebar, topbar, real-time indicator & modals    */
/* ------------------------------------------------------------------ */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Code2,
  CalendarClock,
  BarChart3,
  Settings,
  Menu,
  Search,
  Bell,
  Plus,
  X,
  LogOut,
  ChevronDown,
  Loader2,
  Sparkles,
  CheckCheck,
  Trash2,
  UserPlus,
  Radio,
} from "lucide-react";
import { EvalixLogo, EASE } from "@/components/landing/shared";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { useDashboard } from "./context";
import type { Job } from "./data";

const NAV_MAIN = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/candidates", label: "Candidates", icon: Users, exact: false },
  { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase, exact: false },
  { href: "/dashboard/assessments", label: "Assessments", icon: Code2, exact: false },
  { href: "/dashboard/interviews", label: "Interviews", icon: CalendarClock, exact: false },
];

const NAV_SECONDARY = [
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, exact: false },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/candidates": "Candidates",
  "/dashboard/jobs": "Jobs",
  "/dashboard/assessments": "Technical Assessments",
  "/dashboard/interviews": "AI Interviews",
  "/dashboard/analytics": "Analytics & Intelligence",
  "/dashboard/settings": "Settings & Preferences",
};

/* ------------------------------------------------------------------ */
/* Sidebar content (shared by desktop rail + mobile drawer)            */
/* ------------------------------------------------------------------ */

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { toast, user } = useDashboard();
  const router = useRouter();

  const initials = user
    ? user.name
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "E";

  const logout = async () => {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      /* session already gone */
    }
    router.replace("/login");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/dashboard" onClick={onNavigate} aria-label="EvalixAI home">
          <EvalixLogo invert />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8578]">
          Pipeline
        </p>
        <ul className="flex flex-col gap-1">
          {NAV_MAIN.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
                    active
                      ? "bg-[#2c2a20] text-[#dde0b8]"
                      : "text-[#b9b4a4] hover:bg-white/5 hover:text-[#f4f2ea]"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#dde0b8]" />
                  )}
                  <item.icon className="size-[18px]" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8578]">
          Management
        </p>
        <ul className="flex flex-col gap-1">
          {NAV_SECONDARY.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
                    active
                      ? "bg-[#2c2a20] text-[#dde0b8]"
                      : "text-[#b9b4a4] hover:bg-white/5 hover:text-[#f4f2ea]"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#dde0b8]" />
                  )}
                  <item.icon className="size-[18px]" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#dde0b8] text-[12.5px] font-bold text-[#454e1e]">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium text-[#f4f2ea]">
              {user?.name ?? "Signed in"}
            </span>
            <span className="block truncate text-[11.5px] text-[#8a8578]">
              {user ? `${user.role.charAt(0)}${user.role.slice(1).toLowerCase()} · EvalixAI` : "Hiring lead · EvalixAI"}
            </span>
          </span>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            title="Log out"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-[#8a8578] transition-colors hover:bg-white/5 hover:text-[#f4f2ea]"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

export function Shell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const {
    searchQuery,
    setSearchQuery,
    setNewJobOpen,
    setNewCandidateOpen,
    user,
    wsStatus,
    notifications,
    unreadCount,
    markNotificationsRead,
    clearNotifications,
  } = useDashboard();
  const router = useRouter();

  const initials = user
    ? user.name
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "E";

  const title = TITLES[pathname] ?? "Overview";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setNotifOpen(false);
      }
    };
    const onClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f2ea]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[248px] bg-[#1c1a14] lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[60] bg-[#1d1b15]/45 backdrop-blur-[2px] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-[61] w-[268px] bg-[#1c1a14] lg:hidden"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="absolute right-3 top-4 grid size-9 place-items-center rounded-lg text-[#8a8578] transition-colors hover:bg-white/5 hover:text-[#f4f2ea]"
              >
                <X className="size-4" />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-40 border-b border-[#e5e2d2] bg-[#f4f2ea]/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="grid size-10 place-items-center rounded-xl text-[#55524a] transition-colors hover:bg-[#eeece1] lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            {/* Title & Real-time WebSocket status badge */}
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif-display text-[21px] text-[#1d1b15]">{title}</h1>
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  wsStatus === "connected"
                    ? "border border-[#d4dec2] bg-[#f2f6ea] text-[#4b5a26]"
                    : wsStatus === "connecting"
                      ? "border border-[#f1ecd7] bg-[#fcfaf2] text-[#7a6d2f]"
                      : "border border-[#f2e2da] bg-[#fbf4f1] text-[#a15b48]"
                )}
                title={
                  wsStatus === "connected"
                    ? "Realtime WebSocket connected — updates stream live"
                    : wsStatus === "connecting"
                      ? "Connecting to realtime WebSocket..."
                      : "Realtime WebSocket offline"
                }
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    wsStatus === "connected"
                      ? "bg-[#6f7c3d] animate-pulse"
                      : wsStatus === "connecting"
                        ? "bg-[#c9b96a] animate-ping"
                        : "bg-[#a15b48]"
                  )}
                />
                <span className="hidden sm:inline">
                  {wsStatus === "connected" ? "Live" : wsStatus === "connecting" ? "Syncing…" : "Offline"}
                </span>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8a8578]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push("/dashboard/candidates");
                  }}
                  type="search"
                  placeholder="Search candidates…"
                  aria-label="Search candidates"
                  className="h-10 w-52 rounded-xl border border-[#e5e2d2] bg-[#fffdf7] pl-10 pr-4 text-[13.5px] text-[#1d1b15] placeholder:text-[#8a8578] transition-colors focus:border-[#6f7c3d] focus:outline-none focus:ring-2 focus:ring-[#dde0b8]"
                />
              </div>

              {/* Add candidate button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                onClick={() => setNewCandidateOpen(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#d8d5c4] bg-[#fffdf7] px-3.5 text-[13px] font-medium text-[#1d1b15] shadow-sm transition-colors hover:bg-[#f5f2e6]"
              >
                <UserPlus className="size-3.5 text-[#6f7c3d]" />
                <span className="hidden sm:inline">Add candidate</span>
              </motion.button>

              {/* New job button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
                onClick={() => setNewJobOpen(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#6f7c3d] px-4 text-[13.5px] font-medium text-white shadow-[0_1px_2px_rgba(29,27,21,0.16)] transition-colors hover:bg-[#5a662f]"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">New job</span>
              </motion.button>

              {/* Real-time Notification Bell Popover */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    if (!notifOpen && unreadCount > 0) {
                      markNotificationsRead();
                    }
                  }}
                  aria-label="Realtime notifications"
                  className="relative grid size-10 place-items-center rounded-xl text-[#55524a] transition-colors hover:bg-[#eeece1]"
                >
                  <Bell className="size-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-[#6f7c3d] text-[9.5px] font-bold text-white shadow-sm ring-2 ring-[#f4f2ea]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.22, ease: EASE }}
                      className="absolute right-0 top-12 z-50 w-[320px] sm:w-[380px] overflow-hidden rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] shadow-[0_18px_50px_rgba(29,27,21,0.22)]"
                    >
                      <div className="flex items-center justify-between border-b border-[#e5e2d2] bg-[#faf8ef] px-4 py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-serif-display text-[16px] text-[#1d1b15]">
                            Realtime Activity
                          </p>
                          <span className="rounded-full bg-[#e9ecd2] px-2 py-0.5 text-[10.5px] font-semibold text-[#5a662f]">
                            WebSocket
                          </span>
                        </div>
                        {notifications.length > 0 && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={markNotificationsRead}
                              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#6f7c3d] hover:text-[#5a662f]"
                              title="Mark all as read"
                            >
                              <CheckCheck className="size-3.5" />
                              Read
                            </button>
                            <span className="text-[#c2bda9]">·</span>
                            <button
                              type="button"
                              onClick={clearNotifications}
                              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#8a8578] hover:text-[#a15b48]"
                              title="Clear all"
                            >
                              <Trash2 className="size-3.5" />
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="max-h-[360px] overflow-y-auto p-2 nota-scroll">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-[#8a8578]">
                            <Radio className="size-5 text-[#6f7c3d] animate-pulse" />
                            <p className="text-[13px] font-medium text-[#1d1b15]">All caught up</p>
                            <p className="max-w-[240px] text-[11.5px] leading-relaxed">
                              Real-time events stream in live when candidates apply, advance, or when jobs are published.
                            </p>
                          </div>
                        ) : (
                          <ul className="flex flex-col gap-1.5">
                            {notifications.map((n) => (
                              <li
                                key={n.id}
                                className={cn(
                                  "flex items-start gap-3 rounded-xl p-2.5 transition-colors",
                                  n.read ? "bg-transparent hover:bg-[#faf8ef]" : "bg-[#f4f2ea]/70 hover:bg-[#f4f2ea]"
                                )}
                              >
                                <span
                                  className={cn(
                                    "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-[11px]",
                                    n.tone === "olive" && "bg-[#dde0b8] text-[#454e1e]",
                                    n.tone === "amber" && "bg-[#f1ecd7] text-[#7a6d2f]",
                                    n.tone === "error" && "bg-[#f2e2da] text-[#a15b48]",
                                    (!n.tone || n.tone === "ink") && "bg-[#eeece1] text-[#55524a]"
                                  )}
                                >
                                  <Sparkles className="size-3.5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="truncate text-[13px] font-semibold text-[#1d1b15]">
                                      {n.title}
                                    </p>
                                    <span className="text-[11px] text-[#8a8578]">{n.time}</span>
                                  </div>
                                  <p className="mt-0.5 text-[12.5px] leading-snug text-[#55524a]">
                                    {n.message}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Avatar */}
              <span
                className="grid size-9 shrink-0 place-items-center rounded-full bg-[#1d1b15] text-[12px] font-bold text-[#f4f2ea]"
                title={user?.name ?? "Signed in"}
              >
                {initials}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <NewJobModal />
      <NewCandidateModal />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* New candidate modal                                                 */
/* ------------------------------------------------------------------ */

function NewCandidateModal() {
  const { newCandidateOpen, setNewCandidateOpen, addCandidate, jobs } = useDashboard();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNewCandidateOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setNewCandidateOpen]);

  return (
    <AnimatePresence>
      {newCandidateOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNewCandidateOpen(false)}
            className="fixed inset-0 z-[80] bg-[#1d1b15]/45 backdrop-blur-[2px]"
          />
          <div className="pointer-events-none fixed inset-0 z-[81] grid place-items-center p-4">
            <NewCandidateCard onClose={() => setNewCandidateOpen(false)} addCandidate={addCandidate} jobs={jobs} />
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function NewCandidateCard({
  onClose,
  addCandidate,
  jobs,
}: {
  onClose: () => void;
  addCandidate: (c: {
    name: string;
    email: string;
    role: string;
    job_id?: string;
    location?: string;
    summary?: string;
    matched?: string[];
  }) => Promise<boolean>;
  jobs: Job[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(jobs[0]?.title || "Senior Frontend Engineer");
  const [jobId, setJobId] = useState(jobs[0]?.id || "");
  const [location, setLocation] = useState("Remote");
  const [skills, setSkills] = useState("React, TypeScript, Next.js");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className="pointer-events-auto w-full max-w-md rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-6 shadow-[0_24px_80px_rgba(29,27,21,0.28)]"
      role="dialog"
      aria-modal="true"
      aria-label="Add a new candidate"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-[22px] text-[#1d1b15]">Add new applicant</h2>
          <p className="mt-1 text-[13px] text-[#55524a]">
            Ingests candidate data and broadcasts live over WebSocket to all screens.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-[#8a8578] transition-colors hover:bg-[#eeece1] hover:text-[#1d1b15]"
        >
          <X className="size-4" />
        </button>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          if (!name.trim()) {
            setError("Candidate full name is required.");
            return;
          }
          if (!email.trim() || !email.includes("@")) {
            setError("A valid email address is required.");
            return;
          }
          setBusy(true);
          const matchedSkills = skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

          const ok = await addCandidate({
            name: name.trim(),
            email: email.trim(),
            role: role.trim(),
            job_id: jobId || undefined,
            location: location.trim() || "Remote",
            summary: summary.trim(),
            matched: matchedSkills.length > 0 ? matchedSkills : undefined,
          });
          setBusy(false);
          if (ok) onClose();
        }}
        className="flex flex-col gap-4"
      >
        <Field label="Full name" htmlFor="nc-name">
          <input
            id="nc-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="e.g. Maya Lin"
            className={cn(inputClass, error && "border-[#a15b48] focus:ring-[#f2e2da]")}
          />
          {error && <p className="text-[12px] text-[#a15b48]">{error}</p>}
        </Field>

        <Field label="Email" htmlFor="nc-email">
          <input
            id="nc-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. maya.lin@example.com"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Target role / job" htmlFor="nc-job">
            <div className="relative">
              <select
                id="nc-job"
                value={jobId}
                onChange={(e) => {
                  setJobId(e.target.value);
                  const selectedJob = jobs.find((j) => j.id === e.target.value);
                  if (selectedJob) setRole(selectedJob.title);
                }}
                className={cn(inputClass, "appearance-none pr-8 text-[13px]")}
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#8a8578]" />
            </div>
          </Field>

          <Field label="Location" htmlFor="nc-loc">
            <input
              id="nc-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Remote"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Key skills (comma-separated)" htmlFor="nc-skills">
          <input
            id="nc-skills"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="React, TypeScript, Python..."
            className={inputClass}
          />
        </Field>

        <div className="mt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-full px-5 text-[14px] font-medium text-[#55524a] transition-colors hover:bg-[#eeece1]"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={busy}
            whileHover={busy ? undefined : { scale: 1.03 }}
            whileTap={busy ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#6f7c3d] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#5a662f] disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" />}
            {busy ? "Ingesting…" : "Add candidate"}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* New job modal                                                       */
/* ------------------------------------------------------------------ */

const DEPTS = ["Engineering", "Design", "AI Research", "Platform", "Growth", "Marketing"];
const TYPES = ["Full-time", "Contract", "Part-time"];

function Field({
  label,
  children,
  htmlFor,
}: {
  label: string;
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#55524a]">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#e5e2d2] bg-white px-3.5 text-[14px] text-[#1d1b15] placeholder:text-[#8a8578] transition-colors focus:border-[#6f7c3d] focus:outline-none focus:ring-2 focus:ring-[#dde0b8]";

function NewJobModal() {
  const { newJobOpen, setNewJobOpen, addJob } = useDashboard();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNewJobOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setNewJobOpen]);

  return (
    <AnimatePresence>
      {newJobOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNewJobOpen(false)}
            className="fixed inset-0 z-[80] bg-[#1d1b15]/45 backdrop-blur-[2px]"
          />
          <div className="pointer-events-none fixed inset-0 z-[81] grid place-items-center p-4">
            <NewJobCard onClose={() => setNewJobOpen(false)} addJob={addJob} />
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/* Inner card — remounts on every open, so fields always start fresh */
function NewJobCard({
  onClose,
  addJob,
}: {
  onClose: () => void;
  addJob: (job: Omit<Job, "id" | "status" | "posted" | "pipeline">) => Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState("Engineering");
  const [location, setLocation] = useState("Remote");
  const [type, setType] = useState("Full-time");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      className="pointer-events-auto w-full max-w-md rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-6 shadow-[0_24px_80px_rgba(29,27,21,0.28)]"
      role="dialog"
      aria-modal="true"
      aria-label="Create a new job"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-[22px] text-[#1d1b15]">Post a new job</h2>
          <p className="mt-1 text-[13px] text-[#55524a]">
            EvalixAI starts screening applicants the moment you publish.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-[#8a8578] transition-colors hover:bg-[#eeece1] hover:text-[#1d1b15]"
        >
          <X className="size-4" />
        </button>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          if (!title.trim()) {
            setError("Give the job a title first.");
            return;
          }
          setBusy(true);
          const published = await addJob({
            title: title.trim(),
            dept,
            location: location.trim() || "Remote",
            type,
          });
          setBusy(false);
          if (published) onClose();
        }}
        className="flex flex-col gap-4"
      >
        <Field label="Job title" htmlFor="nj-title">
          <input
            id="nj-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError("");
            }}
            placeholder="e.g. Staff Product Engineer"
            className={cn(inputClass, error && "border-[#a15b48] focus:ring-[#f2e2da]")}
          />
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[12.5px] text-[#a15b48]"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Department" htmlFor="nj-dept">
            <div className="relative">
              <select
                id="nj-dept"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className={cn(inputClass, "appearance-none pr-9")}
              >
                {DEPTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8a8578]" />
            </div>
          </Field>
          <Field label="Type" htmlFor="nj-type">
            <div className="relative">
              <select
                id="nj-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={cn(inputClass, "appearance-none pr-9")}
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8a8578]" />
            </div>
          </Field>
        </div>

        <Field label="Location" htmlFor="nj-loc">
          <input
            id="nj-loc"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Remote"
            className={inputClass}
          />
        </Field>

        <div className="mt-1 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-full px-5 text-[14px] font-medium text-[#55524a] transition-colors hover:bg-[#eeece1]"
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            disabled={busy}
            whileHover={busy ? undefined : { scale: 1.03 }}
            whileTap={busy ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#6f7c3d] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#5a662f] disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" />}
            {busy ? "Publishing…" : "Publish job"}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

/* Re-export EASE for pages that need extra motion */
export { EASE };
