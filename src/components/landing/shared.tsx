"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useInView,
  animate as fmAnimate,
} from "framer-motion";
import { cn } from "@/lib/utils";

/* Shared easing — smooth “easeOutExpo-like” curve used across the page */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ */
/* Brand wordmark — lowercase editorial mark with a rising-bars tile   */
/* ------------------------------------------------------------------ */
export function EvalixLogo({
  className,
  invert = false,
}: {
  className?: string;
  invert?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className={cn(
          "grid size-6 place-items-center rounded-[7px]",
          invert ? "bg-[#f4f2ea]" : "bg-[#1d1b15]"
        )}
      >
        <svg viewBox="0 0 14 14" className="size-3.5" fill="none">
          <path
            d="M3 10.5v2M7 7.5v5M11 4v8.5"
            stroke={invert ? "#1d1b15" : "#f4f2ea"}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span
        className={cn(
          "font-serif-display text-[22px] leading-none tracking-tight",
          invert ? "text-[#f4f2ea]" : "text-[#1d1b15]"
        )}
      >
        EvalixAI
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */
export function PrimaryButton({
  children,
  className,
  href = "#download",
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className={cn(
        "group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#6f7c3d] px-6 text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(29,27,21,0.16)] transition-shadow duration-200 hover:bg-[#5a662f] hover:shadow-[0_6px_20px_rgba(111,124,61,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6f7c3d]",
        className
      )}
    >
      {children}
    </motion.a>
  );
}

export function DarkButton({
  children,
  className,
  href = "#download",
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1d1b15] px-6 text-[15px] font-medium text-[#f4f2ea] transition-shadow duration-200 hover:bg-[#333024] hover:shadow-[0_6px_20px_rgba(29,27,21,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d1b15]",
        className
      )}
    >
      {children}
    </motion.a>
  );
}

export function GhostButton({
  children,
  className,
  href = "#",
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#d9d5c3] bg-transparent px-6 text-[15px] font-medium text-[#1d1b15] transition-colors duration-200 hover:border-[#1d1b15]/40 hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d1b15]",
        className
      )}
    >
      {children}
    </motion.a>
  );
}

/* ------------------------------------------------------------------ */
/* Section eyebrow / kicker label                                       */
/* ------------------------------------------------------------------ */
export function Kicker({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[13px] font-medium uppercase tracking-[0.14em] text-[#8a8578]",
        className
      )}
    >
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Reveal — scroll-triggered fade/rise with shared easing              */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.75, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Counter — animated number that counts up when scrolled into view    */
/* ------------------------------------------------------------------ */
export function Counter({
  to,
  className,
}: {
  to: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = fmAnimate(0, to, {
      duration: 1.6,
      ease: EASE,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* ScoreBar — progress bar that fills when scrolled into view          */
/* ------------------------------------------------------------------ */
export function ScoreBar({
  value,
  delay = 0,
  className,
  tone = "olive",
}: {
  value: number;
  delay?: number;
  className?: string;
  tone?: "olive" | "ink";
}) {
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-[#e5e2d2]",
        className
      )}
    >
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 1.1, delay, ease: EASE }}
        style={{ width: `${value}%` }}
        className={cn(
          "h-full origin-left rounded-full",
          tone === "olive" ? "bg-[#6f7c3d]" : "bg-[#1d1b15]"
        )}
      />
    </div>
  );
}
