"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles, Zap, CalendarCheck, TrendingUp, Info, CircleCheck } from "lucide-react";
import { EvalixLogo, EASE } from "@/components/landing/shared";
import { cn } from "@/lib/utils";
import {
  LoginForm,
  SignupForm,
  SuccessView,
  type AuthMode,
  type Notice,
} from "./auth-forms";

/* Spring used by both panels when they swap sides */
const PANEL_SPRING = {
  type: "spring",
  stiffness: 240,
  damping: 30,
} as const;

/* ------------------------------------------------------------------ */
/* Direction-aware variants                                            */
/*                                                                     */
/* `dir` describes the panel motion of the CURRENT transition:          */
/*   +1 → login→signup (form slides right, image slides left)          */
/*   -1 → signup→login (form slides left, image slides right)          */
/* AnimatePresence passes the latest `custom` to exiting children,     */
/* so both the incoming and outgoing panels follow the same flow.     */
/* ------------------------------------------------------------------ */

const formVariants = {
  enter: (d: number) => ({ opacity: 0, x: -44 * d }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: 44 * d }),
};

const imageVariants = {
  enter: (d: number) => ({ opacity: 0, x: 56 * d }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: -56 * d }),
};

const overlayVariants = {
  enter: (d: number) => ({ opacity: 0, x: 26 * d }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: -26 * d }),
};

/* ------------------------------------------------------------------ */
/* Image panel content per mode                                        */
/* ------------------------------------------------------------------ */

const PANEL_CONTENT: Record<
  AuthMode,
  {
    image: string;
    alt: string;
    badge: string;
    kicker: string;
    headline: string;
    copy: string;
    chips: { icon: React.ComponentType<{ className?: string }>; text: string }[];
  }
> = {
  login: {
    image: "/auth/login.png",
    alt: "A candidate smiling during a warm, well-lit video interview",
    badge: "Pipeline live",
    kicker: "Welcome back",
    headline: "Hiring never sleeps.",
    copy: "EvalixAI kept screening, assessing and ranking candidates while you were away.",
    chips: [
      { icon: Zap, text: "12 candidates ranked" },
      { icon: CalendarCheck, text: "3 interviews scheduled" },
    ],
  },
  signup: {
    image: "/auth/signup.png",
    alt: "A small startup team reviewing candidates together at a wooden table",
    badge: "Free forever plan",
    kicker: "Get started free",
    headline: "Hire like a team 10× your size.",
    copy: "Screening, assessments and AI interviews — running on autopilot from day one.",
    chips: [
      { icon: Zap, text: "Live in 5 minutes" },
      { icon: TrendingUp, text: "3.1× faster shortlists" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Image panel — the half that swaps sides between login and signup    */
/* ------------------------------------------------------------------ */

function ImagePanel({ mode, dir }: { mode: AuthMode; dir: number }) {
  const c = PANEL_CONTENT[mode];
  return (
    <motion.aside
      layout
      transition={PANEL_SPRING}
      className="relative h-56 shrink-0 overflow-hidden sm:h-64 md:h-auto md:w-[46%]"
    >
      {/* Crossfading, sliding photos (Ken Burns on the inner wrapper) */}
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={mode}
          custom={dir}
          variants={imageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: EASE }}
          className="absolute inset-0"
        >
          <motion.div
            className="relative h-full w-full"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src={c.image}
              alt={c.alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Persistent tint + vignette */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#171510]/85 via-[#171510]/25 to-[#171510]/20"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[#6f7c3d]/10 mix-blend-multiply"
      />

      {/* Mode-specific marketing content */}
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={mode}
          custom={dir}
          variants={overlayVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: EASE }}
          className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6 md:p-7"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
              <Sparkles className="size-3" aria-hidden />
              {c.badge}
            </span>

            {/* Floating candidate chip */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: 0.35, duration: 0.5, ease: EASE },
              }}
              className="hidden rounded-xl bg-[#fffdf7]/95 px-3 py-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)] backdrop-blur md:block"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-full bg-[#dde0b8] text-[11px] font-bold text-[#3f4821]">
                  AI
                </span>
                <div>
                  <p className="text-[12px] font-semibold leading-tight text-[#1d1b15]">
                    Candidate profile
                  </p>
                  <p className="text-[10.5px] font-medium leading-tight text-[#6f7c3d]">
                    Live role fit
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#dde0b8]">
              {c.kicker}
            </p>
            <p className="font-serif-display mt-2 text-[26px] font-medium leading-[1.08] tracking-[-0.012em] text-white sm:text-[30px]">
              {c.headline}
            </p>
            <p className="mt-2.5 hidden max-w-[40ch] text-[13.5px] leading-relaxed text-white/75 sm:block">
              {c.copy}
            </p>
            <div className="mt-4 hidden flex-wrap gap-2 md:flex">
              {c.chips.map((chip) => (
                <span
                  key={chip.text}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-medium text-white/90 backdrop-blur-sm"
                >
                  <chip.icon className="size-3.5 text-[#dde0b8]" aria-hidden />
                  {chip.text}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.aside>
  );
}

/* ------------------------------------------------------------------ */
/* Form panel — hosts the mode notice + the swapping forms             */
/* ------------------------------------------------------------------ */

function FormPanel({
  mode,
  dir,
  success,
  userName,
  notice,
  onToggle,
  onSuccess,
  onNotice,
}: {
  mode: AuthMode;
  dir: number;
  success: boolean;
  userName?: string;
  notice: Notice;
  onToggle: (next: AuthMode) => void;
  onSuccess: (name?: string) => void;
  onNotice: (n: Notice) => void;
}) {
  return (
    <motion.div
      layout
      transition={PANEL_SPRING}
      className="flex min-h-[500px] items-center justify-center p-6 sm:p-10 md:min-h-0 md:p-12"
    >
      <div className="w-full max-w-[400px]">
        {/* Inline notice (forgot password, Google, …) */}
        <AnimatePresence initial={false}>
          {notice ? (
            <motion.div
              key={notice.text}
              role="status"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 18 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-snug",
                  notice.kind === "success"
                    ? "border-[#d3d8ae] bg-[#eef0da] text-[#3f4821]"
                    : "border-[#e5e2d2] bg-[#faf8f0] text-[#55524a]"
                )}
              >
                {notice.kind === "success" ? (
                  <CircleCheck
                    className="mt-0.5 size-4 shrink-0 text-[#6f7c3d]"
                    aria-hidden
                  />
                ) : (
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-[#8a8578]"
                    aria-hidden
                  />
                )}
                <span>{notice.text}</span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Direction-aware form swap */}
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={mode}
            custom={dir}
            variants={formVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.42, ease: EASE }}
          >
            {success ? (
              <SuccessView mode={mode} name={userName} />
            ) : mode === "login" ? (
              <LoginForm
                onToggle={() => onToggle("signup")}
                onNotice={onNotice}
                onSuccess={onSuccess}
              />
            ) : (
              <SignupForm
                onToggle={() => onToggle("login")}
                onNotice={onNotice}
                onSuccess={onSuccess}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export function AuthScreen({ initialMode = "login" }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<Notice>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLogin = mode === "login";
  /* Direction of the most recent transition (see variants above) */
  const dir = isLogin ? -1 : 1;

  const toggle = useCallback((next: AuthMode) => {
    setSuccess(false);
    setUserName(undefined);
    setNotice(null);
    setMode(next);
    /* Keep the URL in sync without remounting the component */
    try {
      window.history.replaceState(
        null,
        "",
        next === "login" ? "/login" : "/signup"
      );
    } catch {
      /* SSR or unsupported — URL stays unchanged, no harm done */
    }
  }, []);

  const showNotice = useCallback((n: Notice) => {
    setNotice(n);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 5000);
  }, []);

  const handleSuccess = useCallback((name?: string) => {
    setUserName(name);
    setSuccess(true);
  }, []);

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    []
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-screen flex-col overflow-x-clip bg-[#f4f2ea]">
        {/* Warm glow backdrop */}
        <div
          aria-hidden
          className="nota-warm-glow pointer-events-none absolute inset-0"
        />

        {/* Header */}
        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Link href="/" aria-label="EvalixAI home">
              <EvalixLogo />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
          >
            <Link
              href="/"
              className="group inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium text-[#55524a] transition-colors hover:bg-[#1d1b15]/[0.05] hover:text-[#1d1b15]"
            >
              <ArrowLeft
                className="size-4 transition-transform duration-300 group-hover:-translate-x-0.5"
                aria-hidden
              />
              Back to home
            </Link>
          </motion.div>
        </header>

        {/* Card */}
        <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <motion.section
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#e5e2d2] bg-[#fffdf7] shadow-[0_32px_90px_-28px_rgba(29,27,21,0.3)]"
          >
            {/* login → image on the right · signup → image on the left */}
            <div
              className={cn(
                "flex flex-col md:min-h-[624px]",
                isLogin ? "md:flex-row-reverse" : "md:flex-row"
              )}
            >
              <ImagePanel mode={mode} dir={dir} />
              <FormPanel
                mode={mode}
                dir={dir}
                success={success}
                userName={userName}
                notice={notice}
                onToggle={toggle}
                onSuccess={handleSuccess}
                onNotice={showNotice}
              />
            </div>
          </motion.section>
        </main>

        {/* Footer */}
        <footer className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 text-[12.5px] text-[#8a8578] sm:px-8">
          <p>© 2026 EvalixAI</p>
          <nav aria-label="Legal" className="flex gap-5">
            <a href="#" className="transition-colors hover:text-[#55524a]">
              Terms
            </a>
            <a href="#" className="transition-colors hover:text-[#55524a]">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-[#55524a]">
              Security
            </a>
          </nav>
        </footer>
      </div>
    </MotionConfig>
  );
}
