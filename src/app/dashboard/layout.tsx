import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardProvider } from "@/components/dashboard/context";
import { Shell } from "@/components/dashboard/shell";
import { ACCESS_COOKIE, verifyAccessToken } from "@/lib/jwt";

export const metadata: Metadata = {
  title: "Dashboard — EvalixAI",
  description: "Your AI recruiting cockpit — candidates, jobs, assessments and interviews at a glance.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth on top of middleware: server-rendered guard.
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  if (!payload) redirect("/login");

  return (
    <DashboardProvider>
      <Shell>{children}</Shell>
    </DashboardProvider>
  );
}
