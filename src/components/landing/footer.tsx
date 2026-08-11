"use client";

import { Linkedin, Twitter, Github, Mail } from "lucide-react";
import { EvalixLogo } from "./evalix-logo";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Resume Screening", href: "#resume" },
      { label: "Aptitude Tests", href: "#screening" },
      { label: "AI Mock Interviews", href: "#interviews" },
      { label: "Coding Assessments", href: "#coding" },
      { label: "Ranking & Analytics", href: "#analytics" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Use cases",
    links: [
      { label: "For startups", href: "#startups" },
      { label: "For engineering teams", href: "#" },
      { label: "For sales hiring", href: "#" },
      { label: "For campus recruiting", href: "#" },
      { label: "For agencies", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Press kit", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#docs" },
      { label: "API reference", href: "#" },
      { label: "Security", href: "#" },
      { label: "Status", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "GDPR", href: "#" },
      { label: "DPDP Act", href: "#" },
      { label: "License", href: "#" },
    ],
  },
];

export function Footer() {
  // Hardcoded to match the SRS date (August 2026) and avoid hydration
  // mismatches that occur when the server and client render `new Date()` at
  // different times.
  const year = 2026;

  return (
    <footer className="mt-auto bg-background border-t border-border relative z-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Logo + tagline */}
          <div className="col-span-2 lg:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <EvalixLogo className="h-7 w-7 text-foreground" />
              <span className="font-serif text-2xl leading-none text-foreground tracking-tight">
                evalix<span className="text-primary">AI</span>
              </span>
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The AI hiring pipeline for startups. Source to offer, automated.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[
                { icon: Linkedin, label: "LinkedIn" },
                { icon: Twitter, label: "X (Twitter)" },
                { icon: Github, label: "GitHub" },
                { icon: Mail, label: "Email" },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground/70 hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  <s.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-medium uppercase tracking-wider text-foreground mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {year} EvalixAI Labs · Built by Aakash Sarang &amp; Manish Kumar
            Srivastav
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
