"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { EvalixLogo, EASE } from "./shared";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Screening", href: "#features" },
  { label: "Assessments", href: "#assessments" },
  { label: "Interviews", href: "#interviews" },
  { label: "Analytics", href: "#analytics" },
  { label: "Pricing", href: "#pricing" },
  { label: "Blog", href: "#" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-[#e5e2d2] bg-[#f4f2ea]/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8"
      >
        <motion.a
          href="#top"
          aria-label="EvalixAI home"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className="shrink-0"
        >
          <EvalixLogo />
        </motion.a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="group relative rounded-full px-3.5 py-2 text-[14.5px] text-[#55524a] transition-colors duration-200 hover:text-[#1d1b15]"
              >
                {link.label}
                <span
                  aria-hidden
                  className="absolute inset-x-3.5 bottom-0.5 h-px origin-left scale-x-0 bg-current transition-transform duration-300 ease-out group-hover:scale-x-100"
                />
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
          >
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-full px-4 text-[14.5px] font-medium text-[#55524a] transition-colors duration-200 hover:bg-[#1d1b15]/[0.06] hover:text-[#1d1b15]"
            >
              Sign in
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
          >
            <Link
              href="/signup"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#6f7c3d] px-5 text-[14.5px] font-medium text-white shadow-[0_1px_2px_rgba(29,27,21,0.16)] transition-colors duration-200 hover:bg-[#5a662f]"
            >
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9Zm1.4 13.4c-2.1.9-4.4-.1-5.3-2.2-.9-2.1.1-4.4 2.2-5.3 1.4-.6 3-.3 4.1.7l-1.4 1.4c-.5-.5-1.3-.7-2-.4-1 .4-1.5 1.5-1.1 2.5.4 1 1.5 1.5 2.5 1.1.7-.3 1.1-.9 1.2-1.6h-1.7V11h3.5c.3 2-.7 4-2.6 4.8l1.4 1.4c-.3-.3-.7-.5-1.1-.4l.1-.4Z" />
              </svg>
              Get started
            </Link>
          </motion.div>
        </div>

        {/* Mobile menu button */}
        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          whileTap={{ scale: 0.9 }}
          className="grid size-10 place-items-center rounded-full text-[#1d1b15] transition-colors hover:bg-[#1d1b15]/[0.06] lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </motion.button>
      </nav>

      {/* Mobile menu panel */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="overflow-hidden border-b border-[#e5e2d2] bg-[#f4f2ea] lg:hidden"
          >
            <ul className="space-y-1 px-5 pb-6 pt-2">
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.3, ease: EASE }}
                >
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-base text-[#1d1b15] transition-colors hover:bg-[#1d1b15]/[0.05]"
                  >
                    {link.label}
                    <ArrowUpRight className="size-4 text-[#8a8578]" />
                  </a>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + NAV_LINKS.length * 0.05, duration: 0.3, ease: EASE }}
                className="pt-2"
              >
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-base text-[#1d1b15] transition-colors hover:bg-[#1d1b15]/[0.05]"
                >
                  Sign in
                  <ArrowUpRight className="size-4 text-[#8a8578]" />
                </Link>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + NAV_LINKS.length * 0.05, duration: 0.3, ease: EASE }}
                className="pt-2"
              >
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#6f7c3d] text-[15px] font-medium text-white"
                >
                  <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
                  </svg>
                  Get started
                </Link>
              </motion.li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
