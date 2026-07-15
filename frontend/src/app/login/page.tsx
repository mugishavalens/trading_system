"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import AuthSplit from "@/components/AuthSplit";

type Face = "login" | "register" | "forgot" | "reset";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [face, setFace] = useState<Face>(
    searchParams.get("mode") === "register" ? "register" : "login"
  );

  useEffect(() => {
    setFace(searchParams.get("mode") === "register" ? "register" : "login");
  }, [searchParams]);

  return (
    <AuthSplit>
      <div style={{ perspective: "1000px" }}>
        <div
          className="relative transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: face === "login" ? "rotateY(0deg)" : "rotateY(180deg)",
          }}
        >
          {/* FRONT — login */}
          <div
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              visibility: face === "login" ? "visible" : "hidden",
            }}
          >
            <LoginForm
              onRegister={() => setFace("register")}
              onForgot={() => setFace("forgot")}
            />
          </div>

          {/* BACK — register / forgot / reset (all share the rotated face) */}
          <div
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              visibility: face !== "login" ? "visible" : "hidden",
              marginTop: "-100%",
            }}
          >
            {face === "register" && <RegisterForm onFlip={() => setFace("login")} />}
            {face === "forgot"   && <ForgotPasswordForm onBack={() => setFace("login")} onHaveToken={() => setFace("reset")} />}
            {face === "reset"    && <ResetPasswordForm onDone={() => setFace("login")} />}
          </div>
        </div>
      </div>
    </AuthSplit>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────
function LoginForm({ onRegister, onForgot }: { onRegister: () => void; onForgot: () => void }) {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to your demo trading account.</p>
      </div>
      <div>
        <label className="text-sm text-muted">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent transition-colors"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-muted">Password</label>
          <button
            type="button"
            onClick={onForgot}
            className="text-xs text-accent hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent transition-colors"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-black hover:bg-accent-2 disabled:opacity-60 transition-colors"
      >
        {submitting ? "Signing in…" : "Sign In"}
      </button>
      <p className="text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onRegister}
          className="font-medium text-accent hover:underline"
        >
          Create one
        </button>
      </p>
    </form>
  );
}

// ── Forgot password form ──────────────────────────────────────────────────────
function ForgotPasswordForm({
  onBack,
  onHaveToken,
}: {
  onBack: () => void;
  onHaveToken: () => void;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.forgotPassword(email);
      // token is empty string when email not found (we still show a neutral msg)
      setToken(res.reset_token || null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function copyToken() {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (token) {
    return (
      <div className="space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Reset token ready</h1>
          <p className="mt-1 text-sm text-muted">
            Copy this token — you&apos;ll need it to set your new password. It expires in 1 hour.
          </p>
        </div>
        <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
          <p className="break-all font-mono text-xs text-accent">{token}</p>
        </div>
        <button
          type="button"
          onClick={copyToken}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface transition-colors"
        >
          {copied ? "Copied!" : "Copy token"}
        </button>
        <button
          type="button"
          onClick={onHaveToken}
          className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-black hover:bg-accent-2 transition-colors"
        >
          Use this token →
        </button>
        <button type="button" onClick={onBack} className="w-full text-center text-sm text-muted hover:text-foreground transition-colors">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Forgot password?</h1>
        <p className="mt-1 text-sm text-muted">
          Enter your email and we&apos;ll generate a reset token for you.
        </p>
      </div>
      <div>
        <label className="text-sm text-muted">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent transition-colors"
          placeholder="you@example.com"
        />
      </div>
      {error && (
        <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-black hover:bg-accent-2 disabled:opacity-60 transition-colors"
      >
        {submitting ? "Generating…" : "Get reset token"}
      </button>
      <button type="button" onClick={onBack} className="w-full text-center text-sm text-muted hover:text-foreground transition-colors">
        Back to sign in
      </button>
    </form>
  );
}

// ── Reset password form ───────────────────────────────────────────────────────
function ResetPasswordForm({ onDone }: { onDone: () => void }) {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      await api.resetPassword(token.trim(), newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success text-2xl">✓</div>
        <h1 className="text-2xl font-bold">Password updated</h1>
        <p className="text-sm text-muted">You can now sign in with your new password.</p>
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-black hover:bg-accent-2 transition-colors"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Set new password</h1>
        <p className="mt-1 text-sm text-muted">Paste your reset token and choose a new password.</p>
      </div>
      <div>
        <label className="text-sm text-muted">Reset token</label>
        <input
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-xs outline-none focus:border-accent transition-colors"
          placeholder="Paste token here"
        />
      </div>
      <div>
        <label className="text-sm text-muted">New password</label>
        <input
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent transition-colors"
          placeholder="At least 6 characters"
        />
      </div>
      <div>
        <label className="text-sm text-muted">Confirm password</label>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent transition-colors"
          placeholder="Repeat new password"
        />
      </div>
      {error && (
        <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-black hover:bg-accent-2 disabled:opacity-60 transition-colors"
      >
        {submitting ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

// ── Register form ─────────────────────────────────────────────────────────────
const EXPERIENCE_OPTIONS = [
  { value: "beginner",     label: "Beginner",     desc: "I'm new to trading" },
  { value: "intermediate", label: "Intermediate", desc: "I can read charts and manage risk" },
  { value: "advanced",     label: "Advanced",     desc: "I build my own strategies" },
];

const RISK_OPTIONS = [
  { value: "conservative", label: "Conservative", desc: "Protect capital first" },
  { value: "moderate",     label: "Moderate",     desc: "Balanced risk and reward" },
  { value: "aggressive",   label: "Aggressive",   desc: "Comfortable with volatility" },
];

function RegisterForm({ onFlip }: { onFlip: () => void }) {
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
    <div>
      {/* Step progress bar */}
      <div className="mb-5 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "h-1.5 flex-1 rounded-full transition-all",
              i < step ? "bg-accent" : "bg-surface-2"
            )}
          />
        ))}
      </div>

      {/* Step 1 — credentials */}
      {step === 1 && (
        <form onSubmit={next} className="space-y-4">
          <div>
            <label className="text-sm text-muted">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent transition-colors"
              placeholder="Jane Trader"
            />
          </div>
          <div>
            <label className="text-sm text-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent transition-colors"
              placeholder="At least 6 characters"
            />
          </div>
          {error && (
            <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-black hover:bg-accent-2 transition-colors"
          >
            Continue
          </button>
        </form>
      )}

      {/* Step 2 — experience */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">What&apos;s your trading experience?</p>
          <div className="space-y-2">
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
              onClick={() => setStep(1)}
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

      {/* Step 3 — risk */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-muted">What&apos;s your risk profile?</p>
          <div className="space-y-2">
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
          {error && (
            <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
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
              {submitting ? "Creating…" : "Finish"}
            </button>
          </div>
        </div>
      )}

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onFlip}
          className="font-medium text-accent hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
