"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EvalixLogo } from "./evalix-logo";

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "For startups", href: "#startups" },
  { label: "Docs", href: "#docs" },
];

const productLinks = [
  {
    title: "Resume Screening",
    desc: "AI parsing & semantic relevance scoring",
    href: "#resume",
    icon: "scan",
  },
  {
    title: "Aptitude & Tech Tests",
    desc: "Configurable MCQ, subjective & coding rounds",
    href: "#screening",
    icon: "test",
  },
  {
    title: "AI Mock Interviews",
    desc: "Role-specific interviews with structured feedback",
    href: "#interviews",
    icon: "mic",
  },
  {
    title: "Coding Assessments",
    desc: "Sandboxed execution with plagiarism detection",
    href: "#coding",
    icon: "code",
  },
  {
    title: "Ranking & Analytics",
    desc: "Weighted composite scores & pipeline metrics",
    href: "#analytics",
    icon: "chart",
  },
  {
    title: "Recruitment Workflow",
    desc: "End-to-end pipeline from sourcing to offer",
    href: "#workflow",
    icon: "flow",
  },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border/60"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo + product dropdown */}
        <div className="flex items-center gap-6 lg:gap-8">
          <a href="#" className="flex items-center gap-2 group" aria-label="EvalixAI home">
            <EvalixLogo className="h-7 w-7 text-foreground transition-transform group-hover:scale-105" />
            <span className="font-serif text-2xl leading-none text-foreground tracking-tight">
              evalix<span className="text-primary">AI</span>
            </span>
          </a>

          <div
            className="relative hidden md:block"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button
              className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors py-2"
              aria-expanded={productsOpen}
            >
              Products
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  productsOpen && "rotate-180"
                )}
              />
            </button>
            {productsOpen && (
              <div className="absolute left-0 top-full pt-2 w-[480px]">
                <div className="rounded-2xl border border-border bg-card p-2 shadow-xl shadow-black/5 animate-fade-up">
                  <div className="grid grid-cols-2 gap-1">
                    {productLinks.map((p) => (
                      <a
                        key={p.title}
                        href={p.href}
                        className="flex items-start gap-3 rounded-xl p-3 hover:bg-secondary/70 transition-colors"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <ProductIcon name={p.icon} className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {p.title}
                          </div>
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            {p.desc}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-5 lg:gap-6">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {/* Right: CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Sign in
          </a>
          <a
            href="#cta"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            Start free
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 -mr-2 text-foreground"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            {productLinks.map((p) => (
              <a
                key={p.title}
                href={p.href}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/70"
                onClick={() => setMobileOpen(false)}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ProductIcon name={p.icon} className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
              </a>
            ))}
            <div className="h-px bg-border my-2" />
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="block px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/70 rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3">
              <a
                href="#cta"
                className="block w-full text-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
                onClick={() => setMobileOpen(false)}
              >
                Start free
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function ProductIcon({ name, className }: { name: string; className?: string }) {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
  switch (name) {
    case "scan":
      return (
        <svg {...common}>
          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <path d="M7 12h10" />
        </svg>
      );
    case "test":
      return (
        <svg {...common}>
          <path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
          <path d="M14 3v5h5" />
          <path d="m9 13 2 2 4-4" />
        </svg>
      );
    case "mic":
      return (
        <svg {...common}>
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <path d="M12 19v3" />
        </svg>
      );
    case "code":
      return (
        <svg {...common}>
          <path d="m16 18 6-6-6-6" />
          <path d="m8 6-6 6 6 6" />
          <path d="m14.5 4-5 16" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="m7 14 4-4 4 4 5-6" />
        </svg>
      );
    case "flow":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="6" height="6" rx="1" />
          <rect x="15" y="15" width="6" height="6" rx="1" />
          <path d="M9 6h6a3 3 0 0 1 3 3v6" />
        </svg>
      );
    default:
      return null;
  }
}
