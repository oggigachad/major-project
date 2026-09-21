"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * useGsapReveal — animates children of a container with a staggered
 * fade-up when it scrolls into view. Uses GSAP + ScrollTrigger.
 *
 * Set data-reveal attributes on children to opt them in. If no children
 * have the attribute, the container itself is animated.
 */
export function useGsapReveal<T extends HTMLElement>(
  options: {
    y?: number;
    duration?: number;
    stagger?: number;
    delay?: number;
    once?: boolean;
    start?: string;
  } = {}
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const {
    y = 24,
    duration = 0.8,
    stagger = 0.08,
    delay = 0,
    once = true,
    start = "top 85%",
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !ref.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const targets = el.querySelectorAll<HTMLElement>("[data-reveal]");
      const items = targets.length ? Array.from(targets) : [el];

      ctx = gsap.context(() => {
        gsap.set(items, { opacity: 0, y });
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: once
              ? "play none none none"
              : "play reverse play reverse",
          },
        });
      }, ref);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return ref;
}

/**
 * useSplitTextReveal — splits each `[data-split]` element's text into
 * per-word spans and animates them upward with a stagger when scrolled
 * into view. Mirrors the editorial headline reveal from granola-style sites.
 */
export function useSplitTextReveal<T extends HTMLElement>(
  options: {
    stagger?: number;
    duration?: number;
    y?: number;
    once?: boolean;
    start?: string;
  } = {}
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const {
    stagger = 0.04,
    duration = 0.9,
    y = 40,
    once = true,
    start = "top 80%",
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !ref.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const targets = el.querySelectorAll<HTMLElement>("[data-split]");
      if (!targets.length) return;

      targets.forEach((target) => {
        const text = target.textContent ?? "";
        target.textContent = "";
        const words = text.split(/\s+/).filter(Boolean);
        const lineWrap = document.createElement("span");
        lineWrap.style.display = "inline-block";
        lineWrap.style.overflow = "hidden";
        lineWrap.style.verticalAlign = "top";

        words.forEach((word) => {
          const wordSpan = document.createElement("span");
          wordSpan.style.display = "inline-block";
          wordSpan.style.willChange = "transform";
          wordSpan.textContent = word;
          lineWrap.appendChild(wordSpan);
          // space
          const space = document.createElement("span");
          space.innerHTML = "&nbsp;";
          space.style.display = "inline-block";
          lineWrap.appendChild(space);
        });
        target.appendChild(lineWrap);
      });

      ctx = gsap.context(() => {
        const wordSpans =
          ref.current!.querySelectorAll<HTMLElement>("[data-split] span span");
        gsap.set(wordSpans, { yPercent: 110 });
        gsap.to(wordSpans, {
          yPercent: 0,
          duration,
          stagger,
          ease: "power4.out",
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: once
              ? "play none none none"
              : "play reverse play reverse",
          },
        });
      }, ref);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return ref;
}
