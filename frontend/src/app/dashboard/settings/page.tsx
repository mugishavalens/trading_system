"use client";

import { useState } from "react";
import clsx from "clsx";
import { Bot, CheckCircle2, Loader2, Sparkles, UserCheck, Zap } from "lucide-react";
import { api, ApiError, TradingMode } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const RISK_OPTIONS = [
  { value: "conservative", label: "Conservative" },
  { value: "moderate", label: "Moderate" },
  { value: "aggressive", label: "Aggressive" },
];

const TRADING_MODES: { value: TradingMode; label: string; icon: typeof Bot; description: string }[] = [
  {
    value: "manual",
    label: "Manual",
    icon: UserCheck,
    description: "The AI only ever suggests — you place every trade yourself.",
  },
  {
    value: "assisted",
    label: "Assisted",
    icon: Sparkles,
    description: "The AI prepares trades for high-confidence signals — you approve or reject each one.",
  },
  {
    value: "autonomous",
    label: "Autonomous",
    icon: Zap,
    description: "The AI executes trades on your behalf automatically, sized to your risk profile.",
  },
];

export default function SettingsPage() {
  const { user, token, refreshUser } = useAuth();

  const [experienceLevel, setExperienceLevel] = useState(user?.experience_level ?? "beginner");
  const [riskProfile, setRiskProfile] = useState(user?.risk_profile ?? "moderate");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [modeBusy, setModeBusy] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user || !token) return null;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      await api.updateProfile(token!, {
        experience_level: experienceLevel,
        risk_profile: riskProfile,
      });
      await refreshUser();
      setProfileSaved(true);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : "Could not save changes");
    } finally {
      setSavingProfile(false);
    }
  }

  async function setTradingMode(mode: TradingMode) {
    setModeError(null);
    setModeBusy(true);
    try {
      await api.updateProfile(token!, { trading_mode: mode });
      await refreshUser();
    } catch (err) {
      setModeError(err instanceof ApiError ? err.message : "Could not update trading mode");
    } finally {
      setModeBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);
    setPasswordSaving(true);
    try {
      await api.changePassword(token!, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Could not change password");
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Manage your profile, risk preferences, and AI autopilot.
        </p>
      </div>

      <div className="glass rounded-2xl border-2 border-accent/30 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Bot size={20} />
          </div>
          <div>
            <p className="font-semibold">Trading Mode</p>
            <p className="text-sm text-muted">How involved the AI is in placing your trades</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {TRADING_MODES.map((m) => {
            const Icon = m.icon;
            const active = user.trading_mode === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setTradingMode(m.value)}
                disabled={modeBusy}
                className={clsx(
                  "rounded-xl border p-4 text-left transition-colors disabled:opacity-50",
                  active
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface hover:bg-surface-2"
                )}
              >
                <Icon size={18} className={active ? "text-accent" : "text-muted"} />
                <p className={clsx("mt-2 font-medium", active && "text-accent")}>{m.label}</p>
                <p className="mt-1 text-xs text-muted">{m.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-background/60 p-4 text-sm text-muted">
          <p>
            Every ~90 seconds, the AI checks all 5 symbols. In <strong className="text-foreground">Assisted</strong>{" "}
            or <strong className="text-foreground">Autonomous</strong> mode, if a BUY or SELL signal
            reaches at least <strong className="text-foreground">65% confidence</strong>, it&apos;s sized
            to your <strong className="text-foreground capitalize">{riskProfile}</strong> risk profile
            — the same sizing as clicking &quot;Let AI Execute&quot; yourself. Each symbol has a
            10-minute cooldown so it won&apos;t re-signal repeatedly.
          </p>
          <p className="mt-2">
            This is still a demo signal, not financial advice — markets are uncertain, and
            automated trades can lose virtual money just like manual ones. Switch modes any time.
          </p>
        </div>

        {modeError && <p className="mt-3 text-sm text-danger">{modeError}</p>}
      </div>

      <form onSubmit={saveProfile} className="glass rounded-2xl p-6">
        <p className="font-semibold">Profile</p>
        <p className="mt-1 text-sm text-muted">
          {user.full_name} · {user.email}
        </p>

        <div className="mt-4">
          <label className="text-sm text-muted">Trading experience</label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value as typeof experienceLevel)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent"
          >
            {EXPERIENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label className="text-sm text-muted">Risk profile</label>
          <select
            value={riskProfile}
            onChange={(e) => setRiskProfile(e.target.value as typeof riskProfile)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent"
          >
            {RISK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted">
            Determines how much of your cash balance the AI risks per trade (conservative 5%,
            moderate 10%, aggressive 20%, scaled by signal confidence).
          </p>
        </div>

        {profileError && <p className="mt-3 text-sm text-danger">{profileError}</p>}
        {profileSaved && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 size={14} /> Saved
          </p>
        )}

        <button
          type="submit"
          disabled={savingProfile}
          className="mt-4 flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-medium text-black hover:bg-accent-2 disabled:opacity-60 transition-colors"
        >
          {savingProfile && <Loader2 size={14} className="animate-spin" />}
          Save profile
        </button>
      </form>

      <form onSubmit={changePassword} className="glass rounded-2xl p-6">
        <p className="font-semibold">Change password</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-muted">Current password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-sm text-muted">New password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent"
              placeholder="At least 6 characters"
            />
          </div>
        </div>

        {passwordError && <p className="mt-3 text-sm text-danger">{passwordError}</p>}
        {passwordSaved && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 size={14} /> Password updated
          </p>
        )}

        <button
          type="submit"
          disabled={passwordSaving}
          className="mt-4 flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 font-medium hover:bg-surface disabled:opacity-60 transition-colors"
        >
          {passwordSaving && <Loader2 size={14} className="animate-spin" />}
          Update password
        </button>
      </form>
    </div>
  );
}
