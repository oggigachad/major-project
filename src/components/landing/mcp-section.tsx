"use client";

import { motion } from "framer-motion";
import { Plug, Workflow, Sparkles, ChevronDown } from "lucide-react";
import { Kicker, PrimaryButton, EASE } from "./shared";

const INTEGRATIONS = [
  { name: "Claude", desc: "Reason over your hiring pipeline" },
  { name: "Slack", desc: "Send updates where the team lives" },
  { name: "Notion", desc: "File reports with the rest of your docs" },
  { name: "TrackHQ", desc: "Sync with your existing ATS" },
];

export function McpSection() {
  return (
    <section id="mcp" className="bg-[#eeece1] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <Kicker>
              <span className="inline-flex items-center gap-1.5">
                <Plug className="size-3.5" /> Integrations
              </span>
            </Kicker>
            <h2 className="font-serif-display mt-3 text-balance text-[34px] font-medium leading-[1.08] tracking-[-0.015em] text-[#1d1b15] sm:text-[46px]">
              Use your hiring data anywhere.
            </h2>
            <h3 className="font-serif-display mt-5 text-[21px] font-medium text-[#1d1b15]">
              No more exporting candidate spreadsheets into AI tools.
            </h3>
            <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-[#55524a]">
              Connect EvalixAI in a few clicks and your apps become aware of
              your whole pipeline. Power what you&apos;re working on with what
              you&apos;ve already evaluated.
            </p>
            <div className="mt-8">
              <PrimaryButton href="/signup">
                Start screening free
                <ChevronDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              </PrimaryButton>
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
          >
            <div className="rounded-2xl border border-[#e5e2d2] bg-[#1c1a14] p-5 shadow-[0_24px_60px_-16px_rgba(29,27,21,0.45)] sm:p-6">
              <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
                <span className="grid size-9 place-items-center rounded-full bg-[#6f7c3d]">
                  <Workflow className="size-4.5 text-white" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[#f4f2ea]">
                    EvalixAI connector
                  </p>
                  <p className="text-[12px] text-[#8a8578]">
                    Connected · 4 apps
                  </p>
                </div>
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-[#dde0b8] px-2.5 py-1 text-[11px] font-semibold text-[#3f4821]">
                  <span className="size-1.5 rounded-full bg-[#6f7c3d]" />
                  Active
                </span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {INTEGRATIONS.map((app, i) => (
                  <motion.li
                    key={app.name}
                    initial={{ opacity: 0, x: 18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: 0.15 + i * 0.09, ease: EASE }}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between rounded-xl bg-[#2e2b22] px-4 py-3 transition-colors duration-300 hover:bg-[#37342a]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 place-items-center rounded-lg bg-[#f4f2ea]/10 font-serif-display text-[13px] font-semibold text-[#ece9dd]">
                        {app.name.slice(0, 2)}
                      </span>
                      <div>
                        <p className="text-[13.5px] font-medium text-[#f4f2ea]">
                          {app.name}
                        </p>
                        <p className="text-[12px] text-[#8a8578]">{app.desc}</p>
                      </div>
                    </div>
                    <Sparkles className="size-4 text-[#6f7c3d]" />
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
