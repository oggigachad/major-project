"use client";

import { useGsapReveal } from "./use-gsap";

const logos = [
  "Razorpay",
  "Zomato",
  "Swiggy",
  "Stripe",
  "Notion",
  "Linear",
  "Vercel",
  "Plaid",
  "Figma",
  "Loom",
  "Retool",
  "Supabase",
];

export function LogosMarquee() {
  const ref = useGsapReveal<HTMLDivElement>({ y: 16, stagger: 0 });
  return (
    <section className="py-12 sm:py-16 border-y border-border bg-background">
      <div ref={ref} data-reveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground mb-8">
          Built for the way modern startups hire
        </p>
        <div className="relative overflow-hidden">
          {/* Edge fades */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Marquee track */}
          <div className="flex w-max animate-marquee">
            {[...logos, ...logos].map((logo, i) => (
              <div
                key={i}
                className="flex items-center justify-center px-8 py-2 shrink-0"
              >
                <span className="font-serif text-2xl sm:text-3xl text-foreground/40 hover:text-foreground transition-colors whitespace-nowrap">
                  {logo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
