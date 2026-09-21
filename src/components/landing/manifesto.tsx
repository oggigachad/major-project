"use client";

import { useEffect, useRef } from "react";

/**
 * Manifesto — a bold, full-bleed statement section where each character
 * of the headline animates upward as the user scrolls (the "stomp" effect,
 * adapted professionally for a recruitment brand).
 *
 * The text is pinned while the user scrolls through a fixed distance,
 * during which each character's yPercent is driven by scroll progress.
 */
export function Manifesto() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    const setup = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !sectionRef.current || !textRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      const chars = textRef.current.querySelectorAll<HTMLElement>("[data-m-char]");
      if (!chars.length) return;

      gsap.set(chars, { yPercent: 110, opacity: 0 });

      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=120%",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        });

        // Phase 1: characters rise in (0% → 50%)
        tl.to(chars, {
          yPercent: 0,
          opacity: 1,
          duration: 0.5,
          stagger: { each: 0.015, from: "start" },
          ease: "power3.out",
        });

        // Phase 2: hold briefly, then exit fade (50% → 100%)
        tl.to({}, { duration: 0.15 });
        tl.to(chars, {
          opacity: 0.7,
          duration: 0.35,
          stagger: { each: 0.01, from: "end" },
          ease: "power2.inOut",
        });
      }, sectionRef);
    };

    setup();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ctx?.revert();
        setup();
      }, 250);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      ctx?.revert();
    };
  }, []);

  const line1 = "Hire for what";
  const line2 = "they can do,";
  const line3 = "not what they";
  const line4 = "have done.";

  const renderLine = (line: string) =>
    line.split("").map((c, i) => (
      <span
        key={i}
        data-m-char
        className="inline-block"
        style={{ willChange: "transform, opacity" }}
      >
        {c === " " ? "\u00A0" : c}
      </span>
    ));

  return (
    <section
      ref={sectionRef}
      className="relative h-screen bg-foreground text-background overflow-hidden flex items-center justify-center"
    >
      {/* Grid background */}
      <div aria-hidden="true" className="absolute inset-0 bg-grid-dark opacity-40" />

      {/* Subtle radial glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(200,240,74,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative px-6 sm:px-8 lg:px-12 text-center max-w-6xl">
        <div className="text-xs font-medium uppercase tracking-wider text-accent mb-8">
          The EvalixAI principle
        </div>
        <h2
          ref={textRef}
          className="font-serif text-[44px] sm:text-[72px] lg:text-[96px] xl:text-[112px] leading-[1.0] tracking-[-0.035em] text-balance"
        >
          <span className="block overflow-hidden py-1">{renderLine(line1)}</span>
          <span className="block overflow-hidden py-1 italic text-accent">
            {renderLine(line2)}
          </span>
          <span className="block overflow-hidden py-1">{renderLine(line3)}</span>
          <span className="block overflow-hidden py-1">{renderLine(line4)}</span>
        </h2>
        <p className="mt-12 text-sm sm:text-base text-background/60 max-w-xl mx-auto">
          Resumes describe the past. EvalixAI measures the present — what a
          candidate can actually do, today, under real conditions.
        </p>
      </div>
    </section>
  );
}
