"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, TrendingUp, Zap, Shield, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner", desc: "New to trading" },
  { value: "intermediate", label: "Intermediate", desc: "Can read charts" },
  { value: "advanced", label: "Advanced", desc: "Build own strategies" },
];

const RISK_OPTIONS = [
  { value: "conservative", label: "Conservative", desc: "5% per trade" },
  { value: "moderate", label: "Moderate", desc: "10% per trade" },
  { value: "aggressive", label: "Aggressive", desc: "20% per trade" },
];

export default function AuthPage({ defaultSide }: { defaultSide: "login" | "register" }) {
  const [side, setSide] = useState<"login" | "register">(defaultSide);
  const [flipping, setFlipping] = useState(false);

  function flip(to: "login" | "register") {
    if (to === side || flipping) return;
    setFlipping(true);
    setTimeout(() => {
      setSide(to);
      setFlipping(false);
    }, 300);
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <LeftPanel />

      {/* Right panel — flip card */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2 bg-background">
        <div className="w-full max-w-sm">
          {/* Tab switcher */}
          <div className="flex rounded-2xl border border-border bg-surface p-1 mb-8">
            <button
              onClick={() => flip("login")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                side === "login"
                  ? "bg-gradient-to-r from-accent to-amber-400 text-black shadow-md"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => flip("register")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                side === "register"
                  ? "bg-gradient-to-r from-accent to-amber-400 text-black shadow-md"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Flip card */}
          <div
            className="relative"
            style={{
              perspective: "1200px",
              transformStyle: "preserve-3d",
            }}
          >
            <motion.div
              animate={{ rotateY: flipping ? 90 : 0, opacity: flipping ? 0 : 1 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              <AnimatePresence mode="wait">
                {side === "login" ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <LoginForm onSwitch={() => flip("register")} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RegisterForm onSwitch={() => flip("login")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Login form ── */
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
      setError(err instanceof ApiError ? err.message : "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-8 shadow-xl shadow-black/10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to your trading account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input-field"
          />
        </Field>

        <Field label="Password">
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pr-10"
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>

        {error && <p className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-2.5 text-sm text-danger">{error}</p>}

        <button type="submit" disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-amber-400 py-3 font-semibold text-black shadow-lg shadow-accent/20 hover:shadow-accent/40 disabled:opacity-60 transition-all hover:scale-[1.02]"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          {submitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        No account?{" "}
        <button onClick={onSwitch} className="font-semibold text-accent hover:underline">
          Create one free
        </button>
      </p>
    </div>
  );
}

/* ── Register form ── */
function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [riskProfile, setRiskProfile] = useState("moderate");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function next(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (step === 1 && (!fullName.trim() || !email.trim() || password.length < 6)) {
      setError("Fill every field. Password needs at least 6 characters.");
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  }

  async function handleFinish() {
    setError(null);
    setSubmitting(true);
    try {
      await register({ full_name: fullName, email, password, experience_level: experienceLevel, risk_profile: riskProfile });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-surface p-8 shadow-xl shadow-black/10">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Create account</h1>
          <span className="text-xs text-muted font-medium">Step {step}/3</span>
        </div>
        <p className="text-sm text-muted">$100,000 virtual funds · zero risk</p>
        {/* Progress */}
        <div className="mt-3 flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-accent" : "bg-surface-2"}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }} onSubmit={next} className="space-y-4"
          >
            <Field label="Full name">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Trader" className="input-field" />
            </Field>
            <Field label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className="input-field" />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters" className="input-field pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>
            {error && <p className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-2.5 text-sm text-danger">{error}</p>}
            <button type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-amber-400 py-3 font-semibold text-black shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all hover:scale-[1.02]"
            >
              Continue <ArrowRight size={15} />
            </button>
          </motion.form>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }} className="space-y-4"
          >
            <p className="text-sm font-medium">Your trading experience?</p>
            <div className="space-y-2">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setExperienceLevel(opt.value)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                    experienceLevel === opt.value
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/40 hover:bg-surface-2"
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${experienceLevel === opt.value ? "text-accent" : ""}`}>{opt.label}</p>
                    <p className="text-xs text-muted">{opt.desc}</p>
                  </div>
                  {experienceLevel === opt.value && <CheckCircle2 size={16} className="text-accent shrink-0" />}
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-surface-2 transition-colors">Back</button>
              <button onClick={() => next()} className="flex-1 rounded-xl bg-gradient-to-r from-accent to-amber-400 py-2.5 text-sm font-semibold text-black transition-all hover:scale-[1.02]">Continue</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }} className="space-y-4"
          >
            <p className="text-sm font-medium">Your risk profile?</p>
            <div className="space-y-2">
              {RISK_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setRiskProfile(opt.value)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                    riskProfile === opt.value
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-accent/40 hover:bg-surface-2"
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${riskProfile === opt.value ? "text-accent" : ""}`}>{opt.label}</p>
                    <p className="text-xs text-muted">{opt.desc}</p>
                  </div>
                  {riskProfile === opt.value && <CheckCircle2 size={16} className="text-accent shrink-0" />}
                </button>
              ))}
            </div>
            {error && <p className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-2.5 text-sm text-danger">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-surface-2 transition-colors">Back</button>
              <button onClick={handleFinish} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-amber-400 py-2.5 text-sm font-semibold text-black disabled:opacity-60 transition-all hover:scale-[1.02]"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? "Creating..." : "Finish 🎉"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <button onClick={onSwitch} className="font-semibold text-accent hover:underline">
          Sign in
        </button>
      </p>
    </div>
  );
}

/* ── Shared field wrapper ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/* ── Left panel with animated canvas ── */
function LeftPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const nodes = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.8,
    }));

    let pricePoints: number[] = Array.from({ length: 100 }, (_, i) =>
      canvas.height * 0.6 + Math.sin(i * 0.12) * 50 + (Math.random() - 0.5) * 25
    );

    let animId: number;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Node connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(245,158,11,${0.07 * (1 - d / 130)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Nodes
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(245,158,11,0.4)";
        ctx.fill();
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      // Scrolling price line
      pricePoints.shift();
      const last = pricePoints[pricePoints.length - 1];
      pricePoints.push(Math.max(40, Math.min(canvas.height - 40, last + (Math.random() - 0.48) * 10)));

      const stepX = canvas.width / (pricePoints.length - 1);
      ctx.beginPath();
      pricePoints.forEach((y, i) => i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * stepX, y));
      ctx.strokeStyle = "rgba(245,158,11,0.55)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Glow dot
      const ly = pricePoints[pricePoints.length - 1];
      const grd = ctx.createRadialGradient(canvas.width, ly, 0, canvas.width, ly, 18);
      grd.addColorStop(0, "rgba(245,158,11,0.5)");
      grd.addColorStop(1, "rgba(245,158,11,0)");
      ctx.beginPath(); ctx.arc(canvas.width, ly, 18, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(canvas.width, ly, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245,158,11,1)"; ctx.fill();

      // Grid
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (canvas.height / 6) * i);
        ctx.lineTo(canvas.width, (canvas.height / 6) * i);
        ctx.strokeStyle = "rgba(255,255,255,0.025)";
        ctx.lineWidth = 1; ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden lg:flex"
      style={{ background: "linear-gradient(135deg, #020617 0%, #0a0f1e 60%, #020617 100%)" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 70% 50% at 20% 80%, rgba(245,158,11,0.07) 0%, transparent 60%)" }}
      />

      {/* Logo */}
      <div className="relative z-10 p-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/30">
            <Bot size={18} />
          </div>
          <span className="text-lg font-bold text-white">AI Trading <span className="text-amber-400">Mentor</span></span>
        </Link>
      </div>

      {/* Center cards */}
      <div className="relative z-10 px-10 space-y-3 pb-4">
        {/* Live signal */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-white/10 p-5"
          style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Live AI Signal</span>
            </div>
            <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-bold text-green-400">BUY</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xl font-bold text-white">ETH/USD</p>
              <p className="text-xs text-slate-400 mt-0.5">91% confidence · RSI recovering</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-amber-400">$3,241</p>
              <p className="text-xs text-green-400">+2.4%</p>
            </div>
          </div>
          <div className="mt-3 flex items-end gap-1 h-8">
            {[35, 50, 42, 65, 55, 75, 60, 85, 70, 92, 80, 100].map((h, i) => (
              <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }}
                transition={{ delay: 0.05 * i + 0.5, duration: 0.4 }}
                className="flex-1 rounded-sm"
                style={{ background: h > 65 ? "rgba(245,158,11,0.85)" : "rgba(245,158,11,0.25)" }}
              />
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-2"
        >
          {[
            { icon: TrendingUp, label: "Win Rate", value: "73%" },
            { icon: Zap, label: "Signals", value: "Live" },
            { icon: Shield, label: "Risk Guard", value: "On" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-white/10 p-3 text-center"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <Icon size={13} className="mx-auto text-amber-400 mb-1" />
              <p className="text-[10px] text-slate-500">{label}</p>
              <p className="text-sm font-bold text-white">{value}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="relative z-10 px-10 pb-8 text-xs text-slate-600"
      >
        Bloomberg Terminal meets modern AI · Demo · Virtual funds only
      </motion.p>
    </div>
  );
}
