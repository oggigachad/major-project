"use client";

/* ------------------------------------------------------------------ */
/* Settings — System preferences, AI thresholds & interview controls   */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Sliders,
  Volume2,
  Bell,
  Loader2,
  Save,
  Building,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { useDashboard } from "./context";

interface WorkspaceSettings {
  organization_name: string;
  screening_threshold: number;
  auto_shortlist: boolean;
  anonymize_resumes: boolean;
  interview_depth: "standard" | "deep" | "comprehensive";
  interview_voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  proctoring_strictness: "relaxed" | "standard" | "strict";
  notifications_email: boolean;
  notifications_slack: boolean;
  theme_mode: "light" | "dark" | "system";
}

const DEFAULT_SETTINGS: WorkspaceSettings = {
  organization_name: "Evalix Intelligence Corp",
  screening_threshold: 75,
  auto_shortlist: true,
  anonymize_resumes: true,
  interview_depth: "deep",
  interview_voice: "alloy",
  proctoring_strictness: "standard",
  notifications_email: true,
  notifications_slack: false,
  theme_mode: "system",
};

export function Settings() {
  let toastFn: (msg: string, opts?: { tone?: "success" | "info" | "error" }) => void;
  try {
    const dash = useDashboard();
    toastFn = dash.toast;
  } catch {
    toastFn = (msg: string) => console.log(msg);
  }

  const [settings, setSettings] = useState<WorkspaceSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/v1/settings")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled && data?.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch(() => {
        // Fallback to defaults
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await apiFetch("/api/v1/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toastFn("Settings saved successfully.", { tone: "success" });
      } else {
        toastFn("Failed to update settings.", { tone: "error" });
      }
    } catch {
      toastFn("Error saving settings.", { tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#e5e2d2] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#eef0da] text-[#6f7c3d]">
              <SettingsIcon className="size-5" />
            </span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6f7c3d]">
              Workspace Configuration
            </span>
          </div>
          <h2 className="mt-2 font-serif-display text-[28px] leading-tight text-[#1d1b15] sm:text-[32px]">
            Settings & Preferences
          </h2>
          <p className="mt-1 text-[14px] text-[#716d63]">
            Configure AI screening sensitivity, voice parameters, and automated pipeline rules.
          </p>
        </div>

        <button
          type="button"
          disabled={saving || loading}
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-full bg-[#6f7c3d] px-6 py-2.5 text-[13.5px] font-semibold text-[#f4f2ea] shadow-sm transition-colors hover:bg-[#5a662f] disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Changes
        </button>
      </div>

      {/* Organization Info */}
      <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#eeece1] pb-4">
          <Building className="size-5 text-[#6f7c3d]" />
          <div>
            <h3 className="text-[16px] font-semibold text-[#1d1b15]">Organization Identity</h3>
            <p className="text-[12.5px] text-[#8a8578]">Display name shown to candidates during interview sessions.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[12.5px] font-medium text-[#55524a]">Workspace / Company Name</label>
            <input
              type="text"
              value={settings.organization_name ?? ""}
              onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-[#e5e2d2] bg-white px-3.5 py-2 text-[13.5px] text-[#1d1b15] focus:border-[#6f7c3d] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* AI Screening Configuration */}
      <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#eeece1] pb-4">
          <Sliders className="size-5 text-[#6f7c3d]" />
          <div>
            <h3 className="text-[16px] font-semibold text-[#1d1b15]">AI Screening Sensitivity</h3>
            <p className="text-[12.5px] text-[#8a8578]">Thresholds and bias mitigation rules for resume ranking.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-medium text-[#1d1b15]">Candidate Match Threshold</span>
              <span className="font-bold text-[#6f7c3d]">{settings.screening_threshold ?? 75}% match</span>
            </div>
            <p className="text-[12px] text-[#8a8578]">
              Applicants with match score equal or greater than this threshold are qualified for interview.
            </p>
            <input
              type="range"
              min="30"
              max="95"
              step="5"
              value={settings.screening_threshold ?? 75}
              onChange={(e) => setSettings({ ...settings, screening_threshold: parseInt(e.target.value, 10) || 75 })}
              className="mt-3 w-full accent-[#6f7c3d]"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#eeece1] bg-[#faf8ef] p-4">
            <div>
              <span className="block text-[13.5px] font-semibold text-[#1d1b15]">Auto-Shortlist Qualified Candidates</span>
              <span className="block text-[12px] text-[#716d63]">
                Automatically promote candidates exceeding threshold to the assessment stage.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, auto_shortlist: !settings.auto_shortlist })}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                settings.auto_shortlist ? "bg-[#6f7c3d]" : "bg-[#d4d0c5]"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  settings.auto_shortlist ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#eeece1] bg-[#faf8ef] p-4">
            <div className="flex items-start gap-3">
              <EyeOff className="size-5 text-[#6f7c3d] shrink-0 mt-0.5" />
              <div>
                <span className="block text-[13.5px] font-semibold text-[#1d1b15]">PII Anonymization (Bias Audit)</span>
                <span className="block text-[12px] text-[#716d63]">
                  Strip names, emails, phone numbers, and demographics during initial AI semantic scoring.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, anonymize_resumes: !settings.anonymize_resumes })}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                settings.anonymize_resumes ? "bg-[#6f7c3d]" : "bg-[#d4d0c5]"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  settings.anonymize_resumes ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* AI Interview Controls */}
      <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#eeece1] pb-4">
          <Volume2 className="size-5 text-[#6f7c3d]" />
          <div>
            <h3 className="text-[16px] font-semibold text-[#1d1b15]">AI Interview Voice & Logic</h3>
            <p className="text-[12.5px] text-[#8a8578]">Voice models, question depth, and assessment strictness.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-[12.5px] font-medium text-[#55524a]">Question Progression Depth</label>
            <select
              value={settings.interview_depth ?? "deep"}
              onChange={(e) => setSettings({ ...settings, interview_depth: e.target.value as any })}
              className="mt-1.5 w-full rounded-xl border border-[#e5e2d2] bg-white px-3.5 py-2 text-[13.5px] text-[#1d1b15] focus:border-[#6f7c3d] focus:outline-none"
            >
              <option value="standard">Standard (3 Core Questions)</option>
              <option value="deep">Deep Dive (5 Questions + Adaptive Follow-ups)</option>
              <option value="comprehensive">Comprehensive (7 Questions + Architecture Rubric)</option>
            </select>
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-[#55524a]">AI Spoken Voice Tone</label>
            <select
              value={settings.interview_voice ?? "alloy"}
              onChange={(e) => setSettings({ ...settings, interview_voice: e.target.value as any })}
              className="mt-1.5 w-full rounded-xl border border-[#e5e2d2] bg-white px-3.5 py-2 text-[13.5px] text-[#1d1b15] focus:border-[#6f7c3d] focus:outline-none"
            >
              <option value="alloy">Alloy (Neutral & Professional)</option>
              <option value="echo">Echo (Warm & Conversational)</option>
              <option value="fable">Fable (Articulate & Expressive)</option>
              <option value="nova">Nova (Energetic & Direct)</option>
              <option value="onyx">Onyx (Deep & Authoritative)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-[#e5e2d2] bg-[#fffdf7] p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#eeece1] pb-4">
          <Bell className="size-5 text-[#6f7c3d]" />
          <div>
            <h3 className="text-[16px] font-semibold text-[#1d1b15]">Recruiter Alerts & Notifications</h3>
            <p className="text-[12.5px] text-[#8a8578]">Notification dispatch when interviews complete.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!settings.notifications_email}
              onChange={(e) => setSettings({ ...settings, notifications_email: e.target.checked })}
              className="size-4 rounded accent-[#6f7c3d]"
            />
            <span className="text-[13.5px] text-[#1d1b15]">
              Email me instant candidate scorecard summaries upon interview completion
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!settings.notifications_slack}
              onChange={(e) => setSettings({ ...settings, notifications_slack: e.target.checked })}
              className="size-4 rounded accent-[#6f7c3d]"
            />
            <span className="text-[13.5px] text-[#1d1b15]">
              Dispatch Webhook alerts for candidates recommended as &quot;Strong Hire&quot;
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
