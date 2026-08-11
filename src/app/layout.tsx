import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EvalixAI — AI-Powered Recruitment & Hiring Platform",
  description:
    "EvalixAI automates the end-to-end hiring pipeline — resume screening, aptitude tests, AI mock interviews, coding assessments, and candidate ranking — built for startups.",
  keywords: [
    "AI recruitment",
    "hiring platform",
    "resume screening",
    "AI mock interview",
    "coding assessment",
    "ATS alternative",
    "EvalixAI",
  ],
  authors: [
    { name: "Aakash Sarang" },
    { name: "Manish Kumar Srivastav" },
  ],
  openGraph: {
    title: "EvalixAI — AI-Powered Recruitment & Hiring Platform",
    description:
      "Automate resume screening, aptitude tests, AI mock interviews, coding assessments, and candidate ranking.",
    siteName: "EvalixAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EvalixAI — AI-Powered Recruitment & Hiring Platform",
    description:
      "The AI hiring pipeline for startups. Source to hire, automated.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
