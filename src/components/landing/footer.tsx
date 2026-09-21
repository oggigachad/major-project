"use client";

import { motion } from "framer-motion";
import { Linkedin, Twitter, Youtube } from "lucide-react";
import { EvalixLogo, EASE } from "./shared";

const FOOTER_COLUMNS: {
  heading: string;
  links: { label: string; href: string }[];
}[] = [
  {
    heading: "Product",
    links: [
      { label: "Resume screening", href: "#features" },
      { label: "Assessments", href: "#assessments" },
      { label: "AI interviews", href: "#interviews" },
      { label: "Coding sandbox", href: "#sandbox" },
      { label: "Analytics", href: "#analytics" },
    ],
  },
  {
    heading: "Use cases",
    links: [
      { label: "For engineering hires", href: "#sandbox" },
      { label: "For startup hiring", href: "#testimonials" },
      { label: "For small businesses", href: "#testimonials" },
      { label: "Without an HR team", href: "#features" },
      { label: "Enterprise", href: "#testimonials" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Customers", href: "#testimonials" },
      { label: "Pricing", href: "#pricing" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Help centre", href: "#" },
      { label: "Security", href: "#" },
      { label: "Startup program", href: "#" },
      { label: "Student program", href: "#" },
      { label: "Terms & privacy", href: "#" },
    ],
  },
];

const WORDMARK = "EvalixAI";

export function Footer() {
  return (
    <footer className="bg-[#1c1a14] pt-16 text-[#8a8578]">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <EvalixLogo invert />
            <p className="mt-4 max-w-[220px] text-[14px] leading-relaxed">
              The end-to-end AI hiring engine for startups and small
              businesses.
            </p>
            <p className="mt-3 max-w-[220px] text-[13px] italic leading-relaxed text-[#55524a]">
              Born as an academic project in AI assessment and proctoring —
              now a full hiring pipeline.
            </p>
            <div className="mt-6 flex gap-2">
              {[
                { icon: Linkedin, label: "LinkedIn" },
                { icon: Twitter, label: "X (Twitter)" },
                { icon: Youtube, label: "YouTube" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-full border border-white/15 text-[#b8b3a2] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#dde0b8]/60 hover:text-[#f4f2ea]"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {FOOTER_COLUMNS.map((col, i) => (
            <motion.nav
              key={col.heading}
              aria-label={col.heading}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.08 + i * 0.08, ease: EASE }}
              className="text-[14px]"
            >
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-[#55524a]">
                {col.heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="transition-colors duration-200 hover:text-[#f4f2ea]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.nav>
          ))}
        </div>

        {/* Giant wordmark — letters rise in sequence */}
        <div className="mt-16 select-none overflow-hidden" aria-hidden>
          <p className="font-serif-display -mb-[0.16em] text-center text-[clamp(56px,14vw,220px)] font-medium leading-none tracking-[-0.03em] text-[#f4f2ea]/[0.07]">
            {WORDMARK.split("").map((ch, i) => (
              <motion.span
                key={`${ch}-${i}`}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: EASE }}
                className="inline-block"
              >
                {ch}
              </motion.span>
            ))}
          </p>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-[13px] sm:flex-row">
          <p>© {new Date().getFullYear()} EvalixAI Labs, Inc.</p>
          <p className="font-serif-display italic text-[#55524a]">
            Made for teams that hire fast.
          </p>
        </div>
      </div>
    </footer>
  );
}
