"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, FileCheck, Eye, Clock, Globe } from "lucide-react";
import { useSplitTextReveal } from "./use-gsap";

const guarantees = [
  {
    icon: Lock,
    title: "AES-256 at rest",
    desc: "All candidate data — resumes, recordings, code submissions — encrypted with AES-256 at rest.",
  },
  {
    icon: ShieldCheck,
    title: "TLS 1.2+ in transit",
    desc: "Every request encrypted end-to-end. OAuth 2.0 with strong password policies enforced.",
  },
  {
    icon: FileCheck,
    title: "GDPR & DPDP compliant",
    desc: "Configurable retention (90/180/365 days) with automated PII purge. India's DPDP Act fully supported.",
  },
  {
    icon: Eye,
    title: "Role-based access",
    desc: "RBAC across Admin, Recruiter, Hiring Team Member, and Candidate — data visibility scoped per role.",
  },
  {
    icon: Clock,
    title: "99.9% uptime SLA",
    desc: "Automated daily backups with 24-hour RPO. Graceful degradation when AI services are busy.",
  },
  {
    icon: Globe,
    title: "WCAG 2.1 AA",
    desc: "Candidate-facing interfaces fully accessible. Mobile-responsive for smartphone-first applicants.",
  },
];

export function SecuritySection() {
  const headingRef = useSplitTextReveal<HTMLHeadingElement>();

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="text-xs font-medium uppercase tracking-wider text-primary mb-3">
            Security & compliance
          </div>
          <h2
            ref={headingRef}
            className="font-serif text-[40px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.025em] text-foreground text-balance"
          >
            <span data-split>Candidate data, treated like it should be.</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Hiring involves some of the most sensitive personal data your
            company will ever touch. EvalixAI is built to handle it
            responsibly — with audit trails, configurable retention, and
            explainable AI every step of the way.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {guarantees.map((g, i) => {
            const Icon = g.icon;
            return (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="rounded-2xl border border-border bg-card p-6 hover:border-foreground/20 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-xl text-foreground mb-2">
                  {g.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {g.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
