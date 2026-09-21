"use client";

/* ------------------------------------------------------------------ */
/* Charts — hand-rolled SVG, animated with framer-motion               */
/* (kept custom so every pixel matches the EvalixAI palette)            */
/* ------------------------------------------------------------------ */

import { useEffect, useId, useState } from "react";
import { motion, animate as fmAnimate } from "framer-motion";
import { EASE } from "@/components/landing/shared";
import { cn } from "@/lib/utils";

/* Catmull-Rom → cubic bezier smoothing */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${
      p2.x - (p3.x - p1.x) / 6
    } ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/* ------------------------------------------------------------------ */
/* AreaChart — multi-series line + gradient area                        */
/* ------------------------------------------------------------------ */

export interface Series {
  name: string;
  values: number[];
  color: string;
}

export function AreaChart({
  labels,
  series,
  height = 250,
}: {
  labels: string[];
  series: Series[];
  height?: number;
}) {
  const uid = useId().replace(/[:]/g, "");
  const W = 640;
  const H = height;
  const padL = 10;
  const padR = 56;
  const padT = 18;
  const padB = 30;
  const allVals = series.flatMap((s) => s.values || []);
  const max = (allVals.length > 0 ? Math.max(...allVals, 0) : 10) * 1.1 || 10;
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(1, (labels.length || 1) - 1);
  const y = (v: number) => padT + (1 - (v || 0) / max) * (H - padT - padB);
  const bottom = H - padB;

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-xs text-[#55524a]">
            <span className="size-2 rounded-full" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Candidate flow chart">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`${uid}-g${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* horizontal grid */}
        {[0.25, 0.5, 0.75, 1].map((f) => {
          const gy = padT + (1 - f) * (H - padT - padB);
          return (
            <line
              key={f}
              x1={padL}
              x2={W - padR}
              y1={gy}
              y2={gy}
              stroke="#e5e2d2"
              strokeWidth="1"
              strokeDasharray="2 5"
            />
          );
        })}

        {/* x labels */}
        {labels.map((l, i) => (
          <text
            key={l}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize="10.5"
            fill="#8a8578"
            fontFamily="var(--font-inter)"
          >
            {l}
          </text>
        ))}

        {series.map((s, si) => {
          if (!s.values || s.values.length === 0) return null;
          const pts = s.values.map((v, i) => ({ x: x(i), y: y(v) }));
          if (pts.length === 0) return null;
          const line = smoothPath(pts);
          const last = pts[pts.length - 1];
          if (!last) return null;
          const area = pts.length > 1 ? `${line} L ${last.x} ${bottom} L ${pts[0].x} ${bottom} Z` : "";
          return (
            <g key={s.name}>
              <motion.path
                d={area}
                fill={`url(#${uid}-g${si})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.55 + si * 0.18 }}
              />
              <motion.path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth="2.4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.15 + si * 0.18, ease: EASE }}
              />
              <motion.circle
                cx={last.x}
                cy={last.y}
                r="4.5"
                fill="#fffdf7"
                stroke={s.color}
                strokeWidth="2.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5 + si * 0.18, type: "spring", stiffness: 340, damping: 18 }}
              />
              <motion.text
                x={last.x + 12}
                y={last.y + 3.5}
                fontSize="12.5"
                fontWeight="700"
                fill={s.color}
                fontFamily="var(--font-inter)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.65 + si * 0.18 }}
              >
                {s.values[s.values.length - 1]}
              </motion.text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline — tiny trend line for KPI cards                           */
/* ------------------------------------------------------------------ */

export function Sparkline({
  data = [],
  color = "#6f7c3d",
  className,
}: {
  data?: number[];
  color?: string;
  className?: string;
}) {
  const W = 96;
  const H = 30;

  if (!data || data.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-8 w-24 opacity-40", className)} aria-hidden>
        <line x1="4" y1={H / 2} x2={W - 4} y2={H / 2} stroke={color} strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    );
  }

  if (data.length === 1) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-8 w-24", className)} aria-hidden>
        <circle cx={W / 2} cy={H / 2} r="3" fill={color} />
      </svg>
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i * W) / Math.max(1, data.length - 1),
    y: 3 + (1 - (v - min) / span) * (H - 6),
  }));

  const last = pts[pts.length - 1];
  if (!last) return null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-8 w-24", className)} aria-hidden>
      <motion.path
        d={smoothPath(pts)}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.35, ease: EASE }}
      />
      <motion.circle
        cx={last.x}
        cy={last.y}
        r="2.6"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 400, damping: 16 }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* ScoreRing — animated circular score indicator                        */
/* ------------------------------------------------------------------ */

export function ScoreRing({
  value,
  size = 44,
  stroke = 4,
  className,
  animateNumber = true,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  animateNumber?: boolean;
}) {
  const [shown, setShown] = useState(0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 85 ? "#6f7c3d" : value >= 70 ? "#8a9455" : "#a15b48";

  useEffect(() => {
    if (!animateNumber) return;
    const controls = fmAnimate(0, value, {
      duration: 1.1,
      ease: EASE,
      delay: 0.15,
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, animateNumber]);

  const display = animateNumber ? shown : value;

  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${value} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e2d2" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.1, delay: 0.15, ease: EASE }}
        />
      </svg>
      <span
        className="absolute font-semibold tabular-nums text-[#1d1b15]"
        style={{ fontSize: Math.max(10, size * 0.3), lineHeight: 1 }}
      >
        {display}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* FunnelBars — horizontal pipeline funnel                              */
/* ------------------------------------------------------------------ */

export function FunnelBars({ data }: { data: { label: string; value: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-[13px] text-[#8a8578]">
        No pipeline stages recorded yet.
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const colors = ["#e5e2d2", "#d4d9b4", "#b5bf8a", "#98a465", "#6f7c3d", "#1d1b15"];
  return (
    <div className="flex flex-col gap-2.5">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const prevVal = data[i - 1]?.value ?? 0;
        const conv = i === 0 ? null : (prevVal > 0 ? Math.round((d.value / prevVal) * 100) : 0);
        return (
          <div key={d.label} className="grid grid-cols-[86px_1fr] items-center gap-3 sm:grid-cols-[104px_1fr]">
            <span className="text-[12.5px] font-medium text-[#55524a]">{d.label}</span>
            <div className="flex items-center gap-3">
              <div className="h-8 flex-1 overflow-hidden rounded-lg bg-[#f1efe3]">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.9, delay: 0.1 + i * 0.09, ease: EASE }}
                  style={{ width: `${Math.max(pct, 4)}%`, background: colors[i] }}
                  className="h-full origin-left rounded-lg"
                />
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.09 }}
                className="w-10 text-right text-[13px] font-semibold tabular-nums text-[#1d1b15]"
              >
                {d.value}
              </motion.span>
              <span
                className={cn(
                  "hidden w-[52px] shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold tabular-nums sm:block",
                  i === 0 && "opacity-0",
                  conv !== null && conv < 20
                    ? "bg-[#f2e2da] text-[#a15b48]"
                    : "bg-[#e9ecd2] text-[#5a662f]"
                )}
              >
                {conv !== null ? `${conv}%` : ""}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
