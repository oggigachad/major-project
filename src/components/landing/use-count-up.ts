"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useCountUp — animates a number from 0 to `end` when the element
 * scrolls into view, using anime.js v4. Returns a ref to attach and
 * the current display value.
 */
export function useCountUp(end: number, options: {
  duration?: number;
  decimals?: number;
  start?: string;
} = {}) {
  const { duration = 2000, decimals = 0, start = "top 80%" } = options;
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let observer: IntersectionObserver | undefined;
    let cancelled = false;

    const animate = async () => {
      if (started.current || cancelled) return;
      started.current = true;
      const { animate: animeAnimate } = await import("animejs");
      if (cancelled) return;
      const obj = { n: 0 };
      animeAnimate(obj, {
        n: end,
        duration,
        ease: "outExpo",
        onUpdate: () => {
          setValue(obj.n);
        },
      });
    };

    observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) animate();
      });
    }, { threshold: 0.3 });
    observer.observe(el);

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [end, duration]);

  const formatted =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString();

  return { ref, value: formatted };
}
