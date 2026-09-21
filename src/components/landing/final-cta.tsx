"use client";

import { motion } from "framer-motion";
import { ChevronDown, Sprout } from "lucide-react";
import { GhostButton, PrimaryButton } from "./shared";

export function FinalCta() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <motion.div
        initial={{ opacity: 0, y: 34, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ type: "spring", stiffness: 110, damping: 18 }}
        id="download"
        className="nota-warm-glow relative overflow-hidden rounded-3xl border border-[#e5e2d2] bg-[#fffdf7] px-6 py-16 text-center sm:px-12 sm:py-24"
      >
        <h2 className="font-serif-display mx-auto max-w-2xl text-balance text-[36px] font-medium leading-[1.06] tracking-[-0.015em] text-[#1d1b15] sm:text-[52px]">
          Unlimited candidate screenings, free.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-[#55524a]">
          Screen as many candidates as you like, for as long as you like.
          Upgrade only when you want team analytics and custom assessments.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryButton className="h-12 px-7 text-base" href="/signup">
            Start screening free
            <ChevronDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" />
          </PrimaryButton>
          <GhostButton href="#pricing" className="h-12 px-7 text-base">
            View pricing
          </GhostButton>
        </div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-[13.5px] text-[#8a8578]">
          <Sprout className="size-4" />
          No HR team required
        </p>
      </motion.div>
    </section>
  );
}
