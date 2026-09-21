import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Sign in — EvalixAI",
  description:
    "Sign in to EvalixAI — the AI recruiter for early-stage hiring. Screen, assess, interview and rank candidates on autopilot.",
};

export default function LoginPage() {
  return <AuthScreen initialMode="login" />;
}
