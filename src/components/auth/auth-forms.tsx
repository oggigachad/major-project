"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import {
  Mail,
  Lock,
  UserRound,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Check,
  Info,
  CircleCheck,
} from "lucide-react";
import { EASE } from "@/components/landing/shared";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type AuthMode = "login" | "signup";
export type Notice = { kind: "info" | "success"; text: string } | null;

type FormProps = {
  onToggle: () => void;
  onSuccess: (name?: string) => void;
  onNotice: (notice: Notice) => void;
};

type FieldErrors = Record<string, string | undefined>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputCls =
  "h-full w-full bg-transparent text-[15px] text-[#1d1b15] outline-none placeholder:text-[#b7b2a2]";

/* Stagger choreography for form fields */
const STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.06 } },
};

const ITEM = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/* ------------------------------------------------------------------ */
/* Field — label + icon wrapper + inline error                         */
/* ------------------------------------------------------------------ */

function AuthField({
  id,
  label,
  icon: Icon,
  error,
  right,
  children,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  error?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-[#55524a]"
      >
        {label}
      </label>
      <div
        className={cn(
          "group mt-1.5 flex h-12 items-center gap-2.5 rounded-xl border bg-white px-3.5 transition-all duration-200",
          error
            ? "border-[#c0563f] shadow-[0_0_0_4px_rgba(192,86,63,0.1)]"
            : "border-[#e5e2d2] hover:border-[#d9d5c3] focus-within:border-[#6f7c3d] focus-within:shadow-[0_0_0_4px_rgba(111,124,61,0.13)]"
        )}
      >
        <Icon
          aria-hidden
          className="size-[17px] shrink-0 text-[#b7b2a2] transition-colors duration-200 group-focus-within:text-[#6f7c3d]"
        />
        {children}
        {right}
      </div>
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            key={error}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden text-[12.5px] font-medium text-[#c0563f]"
          >
            <span className="block pt-1.5">{error}</span>
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Checkbox — custom olive checkbox with animated check                */
/* ------------------------------------------------------------------ */

function Checkbox({
  id,
  checked,
  onChange,
  error,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="flex items-start gap-2.5 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f7c3d]"
      >
        <span
          aria-hidden
          className={cn(
            "mt-[1px] grid size-[18px] shrink-0 place-items-center rounded-[6px] border transition-all duration-200",
            checked
              ? "border-[#6f7c3d] bg-[#6f7c3d]"
              : "border-[#d9d5c3] bg-white hover:border-[#8a8578]"
          )}
        >
          <AnimatePresence initial={false}>
            {checked ? (
              <motion.span
                key="check"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="grid place-items-center"
              >
                <Check className="size-3 text-white" strokeWidth={3.5} />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
        <span className="text-[13px] leading-snug text-[#55524a]">
          {children}
        </span>
      </button>
      {error ? (
        <p className="mt-1 pl-8 text-[12.5px] font-medium text-[#c0563f]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

function SubmitButton({
  busy,
  busyLabel,
  children,
}: {
  busy: boolean;
  busyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="submit"
      disabled={busy}
      whileHover={busy ? undefined : { scale: 1.015 }}
      whileTap={busy ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#6f7c3d] text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(29,27,21,0.16)] transition-colors duration-200 hover:bg-[#5a662f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f7c3d] disabled:cursor-wait"
    >
      {busy ? (
        <Loader2 className="size-[18px] animate-spin" aria-hidden />
      ) : null}
      {busy ? busyLabel : children}
    </motion.button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.16 7.16 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function GoogleButton({
  label,
  onNotice,
}: {
  label: string;
  onNotice: (n: Notice) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <motion.button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        window.setTimeout(() => {
          setBusy(false);
          onNotice({
            kind: "info",
            text: "Google sign-in is on the roadmap — use your email for this demo.",
          });
        }, 800);
      }}
      whileHover={busy ? undefined : { scale: 1.015 }}
      whileTap={busy ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-[#e5e2d2] bg-white text-[15px] font-medium text-[#1d1b15] transition-colors duration-200 hover:border-[#d9d5c3] hover:bg-[#faf8f0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f7c3d] disabled:cursor-wait"
    >
      {busy ? (
        <Loader2 className="size-[18px] animate-spin text-[#8a8578]" aria-hidden />
      ) : (
        <GoogleIcon />
      )}
      {busy ? "Connecting…" : label}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Password strength meter                                              */
/* ------------------------------------------------------------------ */

const STRENGTH = [
  { label: "", color: "#8a8578" },
  { label: "Weak", color: "#c0563f" },
  { label: "Fair", color: "#d9a55c" },
  { label: "Good", color: "#8a9a4a" },
  { label: "Strong", color: "#6f7c3d" },
];

function scorePassword(v: string): number {
  let s = 0;
  if (v.length >= 8) s++;
  if (v.length >= 12) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
  return s;
}

function PasswordStrength({ value }: { value: string }) {
  const score = scorePassword(value);
  const meta = STRENGTH[score];
  return (
    <div className="mt-2 flex items-center gap-2.5" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="h-[3px] flex-1 rounded-full"
            initial={{ backgroundColor: "#eeece1" }}
            animate={{ backgroundColor: i <= score ? meta.color : "#eeece1" }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
      <span
        className="w-11 text-right text-[11px] font-semibold"
        style={{ color: meta.color }}
      >
        {meta.label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function greetingFromEmail(email: string): string | undefined {
  const raw = email.trim().split("@")[0]?.split(/[._-]+/)[0] ?? "";
  if (!raw) return undefined;
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="h-px flex-1 bg-[#e5e2d2]" />
      <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8a8578]">
        or
      </span>
      <span aria-hidden className="h-px flex-1 bg-[#e5e2d2]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Login form                                                          */
/* ------------------------------------------------------------------ */

export function LoginForm({ onToggle, onSuccess, onNotice }: FormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const shake = useAnimationControls();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const errs: FieldErrors = {};
    if (!EMAIL_RE.test(email.trim()))
      errs.email = "Enter a valid email address";
    if (password.length < 8)
      errs.password = "Password must be at least 8 characters";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      shake.start({
        x: [0, -10, 10, -6, 6, 0],
        transition: { duration: 0.45 },
      });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          remember,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        user?: { name?: string };
        error?: string;
      };
      if (!res.ok) {
        setErrors({ password: data.error ?? "Sign-in failed. Please try again." });
        shake.start({
          x: [0, -10, 10, -6, 6, 0],
          transition: { duration: 0.45 },
        });
        return;
      }
      onSuccess(
        data.user?.name?.split(/\s+/)[0] ?? greetingFromEmail(email)
      );
    } catch {
      setErrors({
        password: "Network error — check your connection and try again.",
      });
      shake.start({
        x: [0, -10, 10, -6, 6, 0],
        transition: { duration: 0.45 },
      });
    } finally {
      setBusy(false);
    }
  };

  const forgot = () => {
    if (EMAIL_RE.test(email.trim())) {
      onNotice({
        kind: "success",
        text: `If an account exists for ${email.trim()}, a reset link is on its way.`,
      });
    } else {
      onNotice({
        kind: "info",
        text: "Enter your email above first — we'll send the reset link there.",
      });
    }
  };

  return (
    <motion.div animate={shake}>
      <motion.form
        noValidate
        onSubmit={submit}
        variants={STAGGER}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <motion.div variants={ITEM}>
          <h1 className="font-serif-display text-[30px] font-medium leading-tight tracking-[-0.012em] text-[#1d1b15]">
            Welcome back
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[#55524a]">
            Sign in to pick up where your pipeline left off.
          </p>
        </motion.div>

        <motion.div variants={ITEM}>
          <AuthField id="login-email" label="Work email" icon={Mail} error={errors.email}>
            <input
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email)
                  setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="you@company.com"
              className={inputCls}
            />
          </AuthField>
        </motion.div>

        <motion.div variants={ITEM}>
          <AuthField
            id="login-password"
            label="Password"
            icon={Lock}
            error={errors.password}
            right={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="grid size-8 shrink-0 place-items-center rounded-full text-[#8a8578] transition-colors hover:bg-[#1d1b15]/[0.05] hover:text-[#1d1b15]"
              >
                {showPw ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
              </button>
            }
          >
            <input
              id="login-password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="Your password"
              className={inputCls}
            />
          </AuthField>
        </motion.div>

        <motion.div variants={ITEM} className="flex items-center justify-between">
          <Checkbox id="remember" checked={remember} onChange={setRemember}>
            Keep me signed in
          </Checkbox>
          <button
            type="button"
            onClick={forgot}
            className="text-[13px] font-medium text-[#6f7c3d] underline-offset-2 transition-colors hover:text-[#5a662f] hover:underline"
          >
            Forgot password?
          </button>
        </motion.div>

        <motion.div variants={ITEM} className="pt-1">
          <SubmitButton busy={busy} busyLabel="Signing in…">
            Sign in
          </SubmitButton>
        </motion.div>

        <motion.div variants={ITEM}>
          <Divider />
        </motion.div>

        <motion.div variants={ITEM}>
          <GoogleButton label="Continue with Google" onNotice={onNotice} />
        </motion.div>

        <motion.p
          variants={ITEM}
          className="pt-1 text-center text-[13.5px] text-[#55524a]"
        >
          New to EvalixAI?{" "}
          <button
            type="button"
            onClick={onToggle}
            className="group inline-flex items-center gap-1 font-semibold text-[#6f7c3d] transition-colors hover:text-[#5a662f]"
          >
            Create an account
            <ArrowRight
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
            />
          </button>
        </motion.p>
      </motion.form>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Signup form                                                         */
/* ------------------------------------------------------------------ */

export function SignupForm({ onToggle, onSuccess, onNotice }: FormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const shake = useAnimationControls();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const errs: FieldErrors = {};
    if (name.trim().length < 2) errs.name = "Please enter your full name";
    if (!EMAIL_RE.test(email.trim()))
      errs.email = "Enter a valid email address";
    if (password.length < 8)
      errs.password = "Password must be at least 8 characters";
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
      errs.password = "Password must include a letter and a number";
    if (!terms) errs.terms = "Please accept the terms to continue";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      shake.start({
        x: [0, -10, 10, -6, 6, 0],
        transition: { duration: 0.45 },
      });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await apiFetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        user?: { name?: string };
        error?: string;
        issues?: { path?: string; message?: string }[];
      };
      if (!res.ok) {
        if (res.status === 422 && data.issues?.length) {
          const fieldErrs: FieldErrors = {};
          for (const issue of data.issues) {
            const key = issue.path === "name" || issue.path === "email" || issue.path === "password"
              ? issue.path
              : "password";
            if (!fieldErrs[key]) fieldErrs[key] = issue.message;
          }
          setErrors(fieldErrs);
        } else if (res.status === 409) {
          setErrors({ email: data.error ?? "An account with this email exists" });
        } else {
          setErrors({ password: data.error ?? "Sign-up failed. Please try again." });
        }
        shake.start({
          x: [0, -10, 10, -6, 6, 0],
          transition: { duration: 0.45 },
        });
        return;
      }
      onSuccess(data.user?.name?.split(/\s+/)[0] ?? name.trim().split(/\s+/)[0]);
    } catch {
      setErrors({
        password: "Network error — check your connection and try again.",
      });
      shake.start({
        x: [0, -10, 10, -6, 6, 0],
        transition: { duration: 0.45 },
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div animate={shake}>
      <motion.form
        noValidate
        onSubmit={submit}
        variants={STAGGER}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <motion.div variants={ITEM}>
          <h1 className="font-serif-display text-[30px] font-medium leading-tight tracking-[-0.012em] text-[#1d1b15]">
            Create your account
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[#55524a]">
            Free forever. Screen your first candidate in minutes.
          </p>
        </motion.div>

        <motion.div variants={ITEM}>
          <AuthField id="signup-name" label="Full name" icon={UserRound} error={errors.name}>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              placeholder="Jane Cooper"
              className={inputCls}
            />
          </AuthField>
        </motion.div>

        <motion.div variants={ITEM}>
          <AuthField id="signup-email" label="Work email" icon={Mail} error={errors.email}>
            <input
              id="signup-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email)
                  setErrors((p) => ({ ...p, email: undefined }));
              }}
              placeholder="you@company.com"
              className={inputCls}
            />
          </AuthField>
        </motion.div>

        <motion.div variants={ITEM}>
          <AuthField
            id="signup-password"
            label="Password"
            icon={Lock}
            error={errors.password}
            right={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="grid size-8 shrink-0 place-items-center rounded-full text-[#8a8578] transition-colors hover:bg-[#1d1b15]/[0.05] hover:text-[#1d1b15]"
              >
                {showPw ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
              </button>
            }
          >
            <input
              id="signup-password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors((p) => ({ ...p, password: undefined }));
              }}
              placeholder="8+ characters"
              className={inputCls}
            />
          </AuthField>
          {password.length > 0 ? <PasswordStrength value={password} /> : null}
        </motion.div>

        <motion.div variants={ITEM}>
          <Checkbox
            id="terms"
            checked={terms}
            onChange={(v) => {
              setTerms(v);
              if (errors.terms) setErrors((p) => ({ ...p, terms: undefined }));
            }}
            error={errors.terms}
          >
            I agree to the{" "}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="font-medium text-[#6f7c3d] underline underline-offset-2 transition-colors hover:text-[#5a662f]"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="font-medium text-[#6f7c3d] underline underline-offset-2 transition-colors hover:text-[#5a662f]"
            >
              Privacy Policy
            </a>
            .
          </Checkbox>
        </motion.div>

        <motion.div variants={ITEM} className="pt-1">
          <SubmitButton busy={busy} busyLabel="Creating account…">
            Create account
          </SubmitButton>
        </motion.div>

        <motion.div variants={ITEM}>
          <Divider />
        </motion.div>

        <motion.div variants={ITEM}>
          <GoogleButton label="Sign up with Google" onNotice={onNotice} />
        </motion.div>

        <motion.p
          variants={ITEM}
          className="pt-1 text-center text-[13.5px] text-[#55524a]"
        >
          Already hiring with us?{" "}
          <button
            type="button"
            onClick={onToggle}
            className="group inline-flex items-center gap-1 font-semibold text-[#6f7c3d] transition-colors hover:text-[#5a662f]"
          >
            Sign in
            <ArrowRight
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden
            />
          </button>
        </motion.p>
      </motion.form>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Success view — replaces the form after a submit                     */
/* ------------------------------------------------------------------ */

export function SuccessView({
  mode,
  name,
}: {
  mode: AuthMode;
  name?: string;
}) {
  const isLogin = mode === "login";
  return (
    <motion.div
      variants={STAGGER}
      initial="hidden"
      animate="show"
      className="py-8 text-center"
    >
      <motion.div
        variants={ITEM}
        className="mx-auto grid size-[76px] place-items-center rounded-full bg-[#dde0b8]/50"
      >
        <svg viewBox="0 0 52 52" className="size-11" aria-hidden>
          <motion.circle
            cx="26"
            cy="26"
            r="23"
            fill="none"
            stroke="#6f7c3d"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.55, ease: EASE }}
          />
          <motion.path
            d="M16 26.5l7 7 13-14"
            fill="none"
            stroke="#6f7c3d"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 0.45, ease: EASE }}
          />
        </svg>
      </motion.div>

      <motion.h1
        variants={ITEM}
        className="font-serif-display mt-6 text-[30px] font-medium leading-tight tracking-[-0.012em] text-[#1d1b15]"
      >
        {name
          ? `Welcome, ${name}!`
          : isLogin
            ? "You're signed in"
            : "You're all set"}
      </motion.h1>

      <motion.p
        variants={ITEM}
        className="mx-auto mt-2.5 max-w-[36ch] text-[14.5px] leading-relaxed text-[#55524a]"
      >
        {isLogin
          ? "Your pipeline kept moving while you were away — candidates are screened, scored and waiting for you."
          : "Your workspace is ready. Screen your first candidate in minutes — no HR team required."}
      </motion.p>

      <motion.div variants={ITEM} className="mt-7">
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className="inline-block"
        >
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#6f7c3d] px-7 text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(29,27,21,0.16)] transition-colors duration-200 hover:bg-[#5a662f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f7c3d]"
          >
            Explore EvalixAI
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </motion.div>
      </motion.div>

      <motion.p variants={ITEM} className="mt-4 text-[12px] text-[#8a8578]">
        Secured with bcrypt hashing and rotating JWT sessions.
      </motion.p>
    </motion.div>
  );
}
