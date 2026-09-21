import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Create your account — EvalixAI",
  description:
    "Start hiring with EvalixAI for free — AI resume screening, automated assessments, AI mock interviews and data-driven candidate ranking.",
};

export default function SignupPage() {
  return <AuthScreen initialMode="signup" />;
}
