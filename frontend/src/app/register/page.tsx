"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import AuthSplit from "@/components/AuthSplit";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner", desc: "I'm new to trading" },
  { value: "intermediate", label: "Intermediate", desc: "I can read charts and manage risk" },
  { value: "advanced", label: "Advanced", desc: "I build my own strategies" },
];

const RISK_OPTIONS = [
  { value: "conservative", label: "Conservative", desc: "Protect capital first" },
  { value: "moderate", label: "Moderate", desc: "Balanced risk and reward" },
  { value: "aggressive", label: "Aggressive", desc: "Comfortable with volatility" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [riskProfile, setRiskProfile] = useState("moderate");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = 3;

  function next(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (step === 1 && (!fullName || !email || password.length < 6)) {
      setError("Please fill every field. Password needs at least 6 characters.");
      return;
    }
    setStep((s) => Math.min(s + 1, totalSteps));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleFinish() {
    setError(null);
    setSubmitting(true);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        experience_level: experienceLevel,
        risk_profile: riskProfile,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthSplit
      title="Create your demo account"
      subtitle={`Step ${step} of ${totalSteps} — $100,000 in virtual funds, zero risk.`}
    >
      <div className="mb-6 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "h-1.5 flex-1 rounded-full",
              i < step ? "bg-accent" : "bg-surface-2"
            )}
          />
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={next} className="space-y-4">
          <div>
            <label className="text-sm text-muted">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent"
              placeholder="Jane Trader"
            />
          </div>
          <div>
            <label className="text-sm text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent"
              placeholder="At least 6 characters"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-black hover:bg-accent-2 transition-colors"
          >
            Continue
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">What&apos;s your trading experience?</p>
          <div className="space-y-3">
            {EXPERIENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setExperienceLevel(opt.value)}
                className={clsx(
                  "w-full rounded-lg border px-4 py-3 text-left transition-colors",
                  experienceLevel === opt.value
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface hover:border-muted"
                )}
              >
                <p className="font-medium">{opt.label}</p>
                <p className="text-sm text-muted">{opt.desc}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={back}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 font-medium hover:bg-surface transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => next()}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 font-medium text-black hover:bg-accent-2 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">What&apos;s your risk profile?</p>
          <div className="space-y-3">
            {RISK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRiskProfile(opt.value)}
                className={clsx(
                  "w-full rounded-lg border px-4 py-3 text-left transition-colors",
                  riskProfile === opt.value
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface hover:border-muted"
                )}
              >
                <p className="font-medium">{opt.label}</p>
                <p className="text-sm text-muted">{opt.desc}</p>
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={back}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 font-medium hover:bg-surface transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleFinish}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 font-medium text-black hover:bg-accent-2 disabled:opacity-60 transition-colors"
            >
              {submitting ? "Creating account..." : "Finish"}
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthSplit>
  );
}
