import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EvalixAI — The AI recruiter for early-stage hiring",
  description:
    "EvalixAI automates the entire early-stage hiring pipeline for startups and small businesses — AI resume screening, automated assessments, AI mock interviews, sandboxed coding evaluations and data-driven candidate ranking. No HR team required.",
  keywords: [
    "AI recruitment",
    "hiring platform",
    "resume screening",
    "AI interviews",
    "candidate assessments",
    "hiring analytics",
    "startup hiring",
  ],
  openGraph: {
    title: "EvalixAI — The AI recruiter for early-stage hiring",
    description:
      "Screening, assessments and interviews. Without an HR team.",
    siteName: "EvalixAI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${fraunces.variable} ${inter.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
