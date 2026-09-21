"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Search, MessageCircle, Brain, Sparkles, BarChart3 } from "lucide-react";
import { Kicker, EASE } from "./shared";

/* Types out text character-by-character once `active` flips to true */
function useTypewriter(text: string, active: boolean, speed = 16) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!active) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [active, text, speed]);
  return { out, done: out.length >= text.length };
}

const USER_QUESTION = "Which candidates need my attention?";
const AI_RESPONSE =
  "Review the latest candidate activity, compare role fit, and prioritize the next action from your live pipeline.";

export function MemorySection() {
  const panelRef = useRef<HTMLDivElement>(null);
  const inView = useInView(panelRef, { once: true, margin: "-120px" });
  const { out, done } = useTypewriter(AI_RESPONSE, inView);

  return (
    <section id="memory" className="bg-[#eeece1] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Chat demo panel */}
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="order-2 lg:order-1"
          >
            <div className="rounded-2xl border border-[#e5e2d2] bg-[#1c1a14] p-5 shadow-[0_24px_60px_-16px_rgba(29,27,21,0.45)] sm:p-6">
              <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
                <span className="grid size-9 place-items-center rounded-full bg-[#6f7c3d]">
                  <MessageCircle className="size-4.5 text-white" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[#f4f2ea]">
                    EvalixAI Chat
                  </p>
                  <p className="text-[12px] text-[#8a8578]">
                    Knows every candidate you&apos;ve evaluated
                  </p>
                </div>
                <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-[#f4f2ea]/90">
                  <Brain className="size-3" /> Memory on
                </span>
              </div>

              <div className="min-h-[240px] space-y-4 pt-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.15, ease: EASE }}
                  className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#6f7c3d] px-4 py-3 text-[14px] leading-relaxed text-white"
                >
                  {USER_QUESTION}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.55, ease: EASE }}
                  className="max-w-[92%] rounded-2xl rounded-bl-md bg-[#2e2b22] px-4 py-3 text-[14px] leading-relaxed text-[#ece9dd]"
                >
                  {out}
                  {!done && (
                    <span className="nota-caret ml-0.5 inline-block h-4 w-[2px] translate-y-[3px] bg-[#a3bf7a]" />
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.45, delay: 1 }}
                  className="ml-auto flex w-fit items-center gap-2 rounded-2xl rounded-br-md border border-white/15 px-4 py-3"
                >
                  <Sparkles className="size-4 text-[#8a8578]" />
                  <span className="text-[14px] text-[#8a8578]">
                    Ask anything about your pipeline
                  </span>
                  <span className="nota-caret inline-block h-4 w-[2px] bg-[#8a8578]" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="order-1 lg:order-2"
          >
            <Kicker>Perfect hiring memory</Kicker>
            <h2 className="font-serif-display mt-3 text-balance text-[34px] font-medium leading-[1.08] tracking-[-0.015em] text-[#1d1b15] sm:text-[46px]">
              Every candidate, one search away.
            </h2>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-[#55524a]">
              EvalixAI remembers every resume, assessment and interview — across
              every role you open. Ask questions in plain language and get
              answers grounded in what you actually evaluated.
            </p>
            <ul className="mt-8 space-y-3.5">
              {[
                "Ask “who has strong React experience?” and get the real answer",
                "Find any past assessment, interview or note instantly",
                "Track every candidate across every role, all in one place",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#dde0b8] text-[#4a5327]">
                    <Search className="size-3.5" />
                  </span>
                  <span className="text-[15px] leading-relaxed text-[#33302a]">
                    {line}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-[#6f7c3d]">
              <BarChart3 className="size-4" />
              Rank candidates with data-driven hiring analytics
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
