"use client";

import { motion } from "framer-motion";
import { EASE } from "./shared";

const TESTIMONIALS = [
  {
    quote:
      "We screened 200 applications over a weekend and interviewed only the twelve who mattered. Our first hire started three weeks later.",
    name: "Lena Torres",
    role: "CEO, Fernwood",
    initials: "LT",
  },
  {
    quote:
      "The first hiring tool my whole founding team kept using after week two. It reads like we built it for ourselves.",
    name: "Arjun Mehta",
    role: "CTO, Junepath",
    initials: "AM",
  },
  {
    quote:
      "Twenty candidates a week and I finally remember every single conversation. It genuinely feels like a superpower.",
    name: "Priya Raman",
    role: "COO, Tidepool",
    initials: "PR",
  },
  {
    quote:
      "No keyword games, no gut-feel decisions. Just consistent, explainable rankings we can defend to anyone.",
    name: "Elena Petrova",
    role: "Head of Engineering, Cobalt & Co",
    initials: "EP",
  },
  {
    quote:
      "We rolled it out before our first funding round and hired two engineers with it. Onboarding was basically one email.",
    name: "Marcus Bell",
    role: "Founder, Ravel Systems",
    initials: "MB",
  },
  {
    quote:
      "The AI interview feedback practically writes itself. I finally get my evenings back.",
    name: "Sofia Lindqvist",
    role: "Talent Lead, Alderline",
    initials: "SL",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-[#1c1a14] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-[#8a8578]">
            Testimonials
          </p>
          <h2 className="font-serif-display mt-3 max-w-2xl text-balance text-[34px] font-medium leading-[1.08] tracking-[-0.015em] text-[#f4f2ea] sm:text-[46px]">
            Helping small teams hire like big ones.
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: EASE }}
              whileHover={{ y: -6 }}
              className="group flex flex-col bg-[#1c1a14] p-7 transition-colors duration-300 hover:bg-[#26241d] sm:p-8"
            >
              <span
                aria-hidden
                className="font-serif-display text-[44px] leading-[0.6] text-[#6f7c3d] transition-transform duration-300 group-hover:scale-110 group-hover:text-[#a3bf7a]"
              >
                &ldquo;
              </span>
              <blockquote className="mt-5 flex-1">
                <p className="font-serif-display text-[19px] leading-relaxed text-[#ece9dd]">
                  {t.quote}
                </p>
              </blockquote>
              <figcaption className="mt-7 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-[#dde0b8] text-[13px] font-semibold text-[#3f4821]">
                  {t.initials}
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[#f4f2ea]">
                    {t.name}
                  </p>
                  <p className="text-[13px] text-[#8a8578]">{t.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
