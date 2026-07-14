"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User, Settings, Shield, Lock, CheckCircle2, Loader2,
  Bot, Sparkles, UserCheck, Zap, LayoutDashboard, LogOut,
} from "lucide-react";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, TradingMode } from "@/lib/api";

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const RISK_OPTIONS = [
  { value: "conservative", label: "Conservative", desc: "5% of balance per trade" },
  { value: "moderate", label: "Moderate", desc: "10% of balance per trade" },
  { value: "aggressive", label: "Aggressive", desc: "20% of balance per trade" },
];

const TRADING_MODES: { value: TradingMode; label: string; icon: typeof Bot; description: string }[] = [
  { value: "manual", label: "Manual", icon: UserCheck, description: "AI only suggests — you place every trade yourself." },
  { value: "assisted", label: "Assisted", icon: Sparkles, description: "AI proposes trades — you approve or reject each one." },
  { value: "autonomous", label: "Autonomous", icon: Zap, description: "AI executes trades automatically on your behalf." },
];

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "trading", label: "Trading", icon: Settings },
  { id: "security", label: "Security", icon: Lock },
];

export default function ProfilePage() {
  const { user, token, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("profile");

  // Profile state
  const [experienceLevel, setExperienceLevel] = useState(user?.experience_level ?? "beginner");
  const [riskProfile, setRiskProfile] = useState(user?.risk_profile ?? "moderate");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Trading mode state
  const [modeBusy, setModeBusy] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setExperienceLevel(user.experience_level);
      setRiskProfile(user.risk_profile);
    }
  }, [user]);

  // Redirect to login if not authenticated
  if (!user || !token) {
    return (
      <div className="flex-1">
        <LandingNav />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <User size={28} />
          </div>
          <h1 className="text-2xl font-bold">Sign in to view your profile</h1>
          <p className="text-muted">You need to be signed in to access your profile and settings.</p>
          <div className="flex gap-3 mt-2">
            <button onClick={() => router.push("/login")} className="rounded-xl bg-gradient-to-r from-accent to-amber-400 px-6 py-2.5 font-semibold text-black">
              Sign In
            </button>
            <button onClick={() => router.push("/register")} className="rounded-xl border border-border px-6 py-2.5 font-medium">
              Create Account
            </button>
          </div>
        </div>
        <LandingFooter />
      </div>
    );
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      await api.updateProfile(token!, { experience_level: experienceLevel, risk_profile: riskProfile });
      await refreshUser();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
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
      await api.changePassword(token!, { current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Could not change password");
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="flex-1">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-16 pb-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.1) 0%, var(--background) 70%)" }}
        />
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-amber-400 text-black text-2xl font-extrabold shadow-xl shadow-accent/30">
              {user.full_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.full_name}</h1>
              <p className="text-muted text-sm">{user.email}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent capitalize">{user.role}</span>
                <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted capitalize">{user.experience_level}</span>
                <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">
                  ${user.cash_balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} balance
                </span>
              </div>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-2">
              <button
                onClick={() => router.push(user.role === "admin" ? "/admin" : "/dashboard")}
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-surface transition-colors"
              >
                <LayoutDashboard size={15} /> Dashboard
              </button>
              <button
                onClick={() => { logout(); router.push("/"); }}
                className="flex items-center gap-2 rounded-xl border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tabs + Content */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          {/* Tab bar */}
          <div className="flex gap-1 rounded-2xl border border-border bg-surface p-1 mb-8 w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                  tab === id
                    ? "bg-accent text-black shadow-md shadow-accent/30"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {/* Profile tab */}
          {tab === "profile" && (
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={saveProfile}
              className="space-y-6"
            >
              <div className="rounded-3xl border border-border bg-surface p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-semibold">Personal Info</p>
                    <p className="text-xs text-muted">Your account details</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted">Full Name</label>
                    <div className="mt-1.5 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground">
                      {user.full_name}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">Email</label>
                    <div className="mt-1.5 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted">Trading Experience</label>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    {EXPERIENCE_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setExperienceLevel(o.value as typeof experienceLevel)}
                        className={`rounded-xl border py-3 text-sm font-medium transition-all ${
                          experienceLevel === o.value
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-muted hover:border-accent/40 hover:text-foreground"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted">Risk Profile</label>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    {RISK_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setRiskProfile(o.value as typeof riskProfile)}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          riskProfile === o.value
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-accent/40"
                        }`}
                      >
                        <p className={`text-sm font-medium ${riskProfile === o.value ? "text-accent" : ""}`}>{o.label}</p>
                        <p className="text-xs text-muted mt-0.5">{o.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {profileError && <p className="text-sm text-danger">{profileError}</p>}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-amber-400 px-6 py-2.5 font-semibold text-black disabled:opacity-60 hover:shadow-lg hover:shadow-accent/30 transition-all"
                >
                  {savingProfile && <Loader2 size={14} className="animate-spin" />}
                  Save Changes
                </button>
                {profileSaved && (
                  <span className="flex items-center gap-1.5 text-sm text-success">
                    <CheckCircle2 size={15} /> Saved!
                  </span>
                )}
              </div>
            </motion.form>
          )}

          {/* Trading tab */}
          {tab === "trading" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-3xl border border-border bg-surface p-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Bot size={18} />
                  </div>
                  <div>
                    <p className="font-semibold">AI Trading Mode</p>
                    <p className="text-xs text-muted">How involved the AI is in placing your trades</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {TRADING_MODES.map((m) => {
                    const Icon = m.icon;
                    const active = user.trading_mode === m.value;
                    return (
                      <button
                        key={m.value}
                        onClick={() => setTradingMode(m.value)}
                        disabled={modeBusy}
                        className={`rounded-2xl border p-5 text-left transition-all disabled:opacity-50 ${
                          active ? "border-accent bg-accent/10" : "border-border hover:border-accent/40 hover:bg-surface-2"
                        }`}
                      >
                        <Icon size={20} className={active ? "text-accent" : "text-muted"} />
                        <p className={`mt-3 font-semibold ${active ? "text-accent" : ""}`}>{m.label}</p>
                        <p className="mt-1 text-xs text-muted leading-relaxed">{m.description}</p>
                        {active && (
                          <span className="mt-3 inline-flex items-center gap-1 text-xs text-accent font-medium">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {modeError && <p className="mt-3 text-sm text-danger">{modeError}</p>}

                <div className="mt-5 rounded-2xl border border-border bg-background/60 p-4 text-sm text-muted">
                  Every ~90 seconds the AI checks all 5 symbols. In <strong className="text-foreground">Assisted</strong> or{" "}
                  <strong className="text-foreground">Autonomous</strong> mode, signals above 65% confidence are sized to your{" "}
                  <strong className="text-foreground capitalize">{user.risk_profile}</strong> risk profile.
                </div>
              </div>

              {/* Portfolio snapshot */}
              <div className="rounded-3xl border border-border bg-surface p-6">
                <p className="font-semibold mb-4">Account Snapshot</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: "Cash Balance", value: `$${user.cash_balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                    { label: "Experience", value: user.experience_level, capitalize: true },
                    { label: "Risk Profile", value: user.risk_profile, capitalize: true },
                    { label: "Trading Mode", value: user.trading_mode, capitalize: true },
                  ].map(({ label, value, capitalize }) => (
                    <div key={label} className="rounded-2xl border border-border bg-surface-2 p-4">
                      <p className="text-xs text-muted">{label}</p>
                      <p className={`mt-1 font-semibold text-sm ${capitalize ? "capitalize" : ""}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Security tab */}
          {tab === "security" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <form onSubmit={changePassword} className="rounded-3xl border border-border bg-surface p-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                    <Shield size={18} />
                  </div>
                  <div>
                    <p className="font-semibold">Change Password</p>
                    <p className="text-xs text-muted">Update your account password</p>
                  </div>
                </div>

                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className="text-sm font-medium text-muted">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="mt-1.5 w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                {passwordError && <p className="mt-3 text-sm text-danger">{passwordError}</p>}
                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-amber-400 px-6 py-2.5 font-semibold text-black disabled:opacity-60 hover:shadow-lg hover:shadow-accent/30 transition-all"
                  >
                    {passwordSaving && <Loader2 size={14} className="animate-spin" />}
                    Update Password
                  </button>
                  {passwordSaved && (
                    <span className="flex items-center gap-1.5 text-sm text-success">
                      <CheckCircle2 size={15} /> Updated!
                    </span>
                  )}
                </div>
              </form>

              <div className="rounded-3xl border border-danger/20 bg-danger/5 p-6">
                <p className="font-semibold text-danger">Sign Out</p>
                <p className="mt-1 text-sm text-muted">Sign out of your account on this device.</p>
                <button
                  onClick={() => { logout(); router.push("/"); }}
                  className="mt-4 flex items-center gap-2 rounded-xl border border-danger/30 px-5 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
