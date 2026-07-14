"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Bot, BookOpen, Newspaper, LineChart, ShieldCheck, Brain,
  ArrowRight, PlayCircle, TrendingUp, Zap, Award, Users,
  ChevronRight, Star, BarChart2, MessageSquare, Cpu,
} from "lucide-react";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";
import { useAuth } from "@/lib/auth-context";

const FEATURES = [
  { icon: Bot, title: "AI Market Analysis", body: "Technical indicators, trend, and volatility fused into one transparent read of the market — every time, every symbol.", gradient: "from-amber-500/20 to-orange-500/10", iconBg: "bg-amber-500/20 text-amber-400" },
  { icon: BookOpen, title: "AI Trading Tutor", body: "Ask about RSI, Fibonacci, or Smart Money Concepts and get plain-English answers tied to live examples.", gradient: "from-blue-500/20 to-cyan-500/10", iconBg: "bg-blue-500/20 text-blue-400" },
  { icon: Newspaper, title: "News Intelligence", body: "Headlines summarized and scored for sentiment and impact, so you know what's actually moving the market.", gradient: "from-purple-500/20 to-pink-500/10", iconBg: "bg-purple-500/20 text-purple-400" },
  { icon: LineChart, title: "Autonomous Demo Trading", body: "Let the AI place, manage, and close trades with virtual funds — nothing here ever touches real money.", gradient: "from-green-500/20 to-emerald-500/10", iconBg: "bg-green-500/20 text-green-400" },
  { icon: ShieldCheck, title: "Risk Management", body: "Position sizing, exposure limits, and drawdown protection are baked into every automated decision.", gradient: "from-red-500/20 to-rose-500/10", iconBg: "bg-red-500/20 text-red-400" },
  { icon: Brain, title: "Continuous Learning", body: "The system tracks its own win rate and reasoning quality over time, in full view of the user.", gradient: "from-indigo-500/20 to-violet-500/10", iconBg: "bg-indigo-500/20 text-indigo-400" },
];

const STEPS = [
  { icon: Users, label: "Create Account", desc: "Register in 60 seconds" },
  { icon: BookOpen, label: "Learn Trading", desc: "Structured courses & quizzes" },
  { icon: LineChart, label: "Analyze Markets", desc: "AI reads every symbol" },
  { icon: Bot, label: "AI Trades", desc: "Autopilot executes for you" },
  { icon: TrendingUp, label: "Track Performance", desc: "Full portfolio analytics" },
  { icon: Award, label: "Get Certified", desc: "Earn your trading badge" },
];

const STATS = [
  { value: "5+", label: "Trading Symbols" },
  { value: "11", label: "Courses & Lessons" },
  { value: "100%", label: "Explainable AI" },
  { value: "$100K", label: "Virtual Funds" },
];

const AI_AGENTS = [
  { icon: BarChart2, name: "Market Analyst", role: "Reads charts, finds trends, detects support & resistance levels in real time.", color: "from-amber-500/20 to-yellow-500/10", iconColor: "text-amber-400", badge: "bg-amber-500/15 text-amber-400" },
  { icon: Newspaper, name: "News Analyst", role: "Reads financial headlines, detects market-moving events, scores sentiment impact.", color: "from-purple-500/20 to-pink-500/10", iconColor: "text-purple-400", badge: "bg-purple-500/15 text-purple-400" },
  { icon: ShieldCheck, name: "Risk Manager", role: "Calculates position sizes, monitors exposure, vetoes trades when risk is too high.", color: "from-red-500/20 to-rose-500/10", iconColor: "text-red-400", badge: "bg-red-500/15 text-red-400" },
  { icon: BookOpen, name: "Trading Coach", role: "Teaches concepts, creates quizzes, and explains every mistake in plain language.", color: "from-blue-500/20 to-cyan-500/10", iconColor: "text-blue-400", badge: "bg-blue-500/15 text-blue-400" },
  { icon: Cpu, name: "Execution Agent", role: "Places demo trades, monitors open positions, adjusts stops and targets automatically.", color: "from-green-500/20 to-emerald-500/10", iconColor: "text-green-400", badge: "bg-green-500/15 text-green-400" },
];

const DEBATE_TURNS = [
  { agent: "Market Analyst", icon: BarChart2, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", verdict: "BUY", verdictColor: "text-green-400 bg-green-500/10", message: "RSI recovering from oversold. EMA-20 crossed above EMA-50. Strong uptrend momentum on BTC." },
  { agent: "News Analyst", icon: Newspaper, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", verdict: "CAUTION", verdictColor: "text-amber-400 bg-amber-500/10", message: "Inflation data due tomorrow. Sentiment mixed. Recent headlines show institutional hesitation." },
  { agent: "Risk Manager", icon: ShieldCheck, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", verdict: "REDUCE", verdictColor: "text-orange-400 bg-orange-500/10", message: "Portfolio already 42% BTC exposure. Adding more exceeds conservative threshold of 35%." },
  { agent: "Trading Coach", icon: BookOpen, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", verdict: "WAIT", verdictColor: "text-blue-400 bg-blue-500/10", message: "User historically loses 70% of trades entered during high-volatility periods. Consider waiting." },
];

export default function LandingPage() {
  return (
    <div className="flex-1 overflow-hidden">
      <LandingNav />
      <Hero />
      <Stats />
      <Features />
      <AIPersonas />
      <AIDebate />
      <HowItWorks />
      <DashboardPreview />
      <Testimonials />
      <CallToAction />
      <LandingFooter />
    </div>
  );
}

// ── Animated particle canvas for hero background ──────────────────────────────
function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;
    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", resize);

    const pts = Array.from({ length: 50 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));

    let price = Array.from({ length: 120 }, (_, i) =>
      h * 0.6 + Math.sin(i * 0.12) * 60 + (Math.random() - 0.5) * 30
    );

    let id: number;
    function draw() {
      ctx!.clearRect(0, 0, w, h);
      // connections — bright gold so visible on both themes
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 160) {
            ctx!.beginPath();
            ctx!.moveTo(pts[i].x, pts[i].y);
            ctx!.lineTo(pts[j].x, pts[j].y);
            ctx!.strokeStyle = `rgba(245,158,11,${0.18 * (1 - d / 160)})`;
            ctx!.lineWidth = 0.8;
            ctx!.stroke();
          }
        }
      }
      // dots
      pts.forEach(p => {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(245,158,11,0.55)";
        ctx!.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      });
      // scrolling price line
      price.shift();
      price.push(price[price.length - 1] + (Math.random() - 0.48) * 6);
      const sx = w / (price.length - 1);
      ctx!.beginPath();
      price.forEach((y, i) => i === 0 ? ctx!.moveTo(0, y) : ctx!.lineTo(i * sx, y));
      ctx!.strokeStyle = "rgba(245,158,11,0.5)";
      ctx!.lineWidth = 2;
      ctx!.stroke();
      // glow dot at tip
      const lastY = price[price.length - 1];
      ctx!.beginPath();
      ctx!.arc(w - 2, lastY, 5, 0, Math.PI * 2);
      ctx!.fillStyle = "rgba(245,158,11,1)";
      ctx!.fill();
      id = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full opacity-60" />;
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const { user } = useAuth();
  const heroHref = user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/register";
  const heroLabel = user ? "Go to Dashboard" : "Start Free Demo";
  return (
    <section className="relative min-h-[92vh] overflow-hidden px-6 pt-20 pb-24 flex items-center">
      {/* ── Background image layer ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* The trading desk photo */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: "url('/trading-hero.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Theme-aware overlay: dark in dark mode, lighter tint in light mode */}
        <div className="absolute inset-0 bg-background/75 dark:bg-background/80"
          style={{ background: "color-mix(in srgb, var(--background) 78%, transparent)" }} />
        {/* Extra bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40"
          style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }} />
      </div>

      {/* ── Particle canvas on top of image ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-[5]">
        <HeroCanvas />
        {/* Colour glows */}
        <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)" }} />
        <div className="absolute top-1/3 -left-20 h-[400px] w-[400px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.7) 0%, transparent 70%)" }} />
        <div className="absolute top-1/4 -right-20 h-[350px] w-[350px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.6) 0%, transparent 70%)" }} />
      </div>

      <div className="mx-auto max-w-5xl text-center w-full">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent backdrop-blur-sm">
          <Zap size={12} className="fill-accent" />
          Demo mode · virtual funds only · not financial advice
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-8 text-5xl font-extrabold tracking-tight sm:text-7xl leading-tight text-foreground drop-shadow-2xl">
          Your AI Trading Partner
          <br />
          <span className="bg-gradient-to-r from-amber-300 via-accent to-orange-400 bg-clip-text text-transparent">
            That Thinks Smarter.
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted leading-relaxed drop-shadow">
          Learn trading, analyze the market, and let an AI copilot execute demo trades with explainable, risk-aware decisions — all in one professional platform.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href={heroHref}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent to-amber-400 px-8 py-3.5 font-semibold text-black shadow-xl shadow-accent/40 hover:shadow-accent/60 transition-all hover:scale-105">
            <span className="relative flex items-center gap-2">
              {heroLabel} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          <a href="#dashboard-preview"
            className="flex items-center gap-2 rounded-2xl border border-border bg-surface/70 px-8 py-3.5 font-medium text-foreground backdrop-blur-sm hover:bg-surface transition-all">
            <PlayCircle size={18} className="text-accent" /> Watch Demo
          </a>
        </motion.div>

        {/* Floating stat cards */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { label: "BTC/USD", value: "+2.4%", color: "text-success" },
            { label: "AI Signal", value: "BUY 91%", color: "text-accent" },
            { label: "Portfolio", value: "$102,481", color: "text-blue-500" },
          ].map((item) => (
            <div key={item.label}
              className="rounded-2xl border border-border bg-surface/80 p-4 backdrop-blur-md shadow-sm">
              <p className="text-xs text-muted">{item.label}</p>
              <p className={`mt-1 text-sm font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function Stats() {
  return (
    <section className="px-6 py-12 border-y border-border">
      <div className="mx-auto max-w-4xl grid grid-cols-2 gap-6 sm:grid-cols-4">
        {STATS.map(({ value, label }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
            <p className="text-3xl font-extrabold text-accent">{value}</p>
            <p className="mt-1 text-sm text-muted">{label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
function Features() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <span className="inline-block rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">Platform Features</span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">An AI copilot for every part of trading</h2>
          <p className="mt-4 text-muted max-w-xl mx-auto">Everything you need to learn, analyze, and trade — in one place.</p>
        </motion.div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body, gradient, iconBg }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${gradient} p-6 backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 hover:border-white/20 hover:shadow-xl`}>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconBg}`}><Icon size={22} /></div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{body}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ChevronRight size={12} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── AI Personas ───────────────────────────────────────────────────────────────
function AIPersonas() {
  return (
    <section id="ai-agents" className="px-6 py-24 relative overflow-hidden">
      {/* Background image with overlay */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0"
          style={{ backgroundImage: "url('/trading-charts.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-background/90" />
      </div>
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <span className="inline-block rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">Multi-Agent AI</span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">Five specialists. One seamless experience.</h2>
          <p className="mt-4 text-muted max-w-2xl mx-auto">
            Behind every decision is a council of specialized agents — each with a clear role, each visible to you.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {AI_AGENTS.map(({ icon: Icon, name, role, color, iconColor, badge }, i) => (
            <motion.div key={name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`group relative rounded-3xl border border-white/10 bg-gradient-to-br ${color} p-6 backdrop-blur-sm hover:-translate-y-1 transition-all duration-300 hover:border-white/20 hover:shadow-xl`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ${iconColor} mb-4`}>
                <Icon size={22} />
              </div>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge} mb-3`}>Agent</span>
              <h3 className="font-bold text-sm leading-tight">{name}</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">{role}</p>
            </motion.div>
          ))}
        </div>

        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }}
          className="mt-8 text-center text-sm text-muted">
          You experience them as one assistant — internally, each agent has a clear, auditable responsibility.
        </motion.p>
      </div>
    </section>
  );
}

// ── AI Debate ─────────────────────────────────────────────────────────────────
function AIDebate() {
  return (
    <section id="ai-debate" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <span className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-400">Unique Feature</span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">Watch the AI debate before it decides.</h2>
          <p className="mt-4 text-muted max-w-xl mx-auto">
            No black-box decisions. Every trade recommendation is reached through a multi-agent debate — and you see the full transcript.
          </p>
        </motion.div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">Live Debate — BTC/USD</span>
            </div>
          </div>

          <div className="space-y-4">
            {DEBATE_TURNS.map(({ agent, icon: Icon, color, bg, verdict, verdictColor, message }, i) => (
              <motion.div key={agent} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className={`flex items-start gap-4 rounded-2xl border p-4 ${bg}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 ${color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${color}`}>{agent}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${verdictColor}`}>{verdict}</span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{message}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Final decision */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.7 }}
            className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare size={18} className="text-accent" />
              <div>
                <p className="text-xs text-muted font-medium uppercase tracking-widest">Final Decision</p>
                <p className="font-bold text-foreground">WAIT — Risk too high for current exposure</p>
              </div>
            </div>
            <span className="rounded-xl bg-amber-500/15 px-3 py-1.5 text-sm font-bold text-amber-400">HOLD</span>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.8 }}
          className="mt-8 text-center">
          <Link href="/register"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-amber-400 px-6 py-3 font-semibold text-black shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-all hover:scale-105">
            See it live in your account <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24 relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-30"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(245,158,11,0.08) 0%, transparent 70%)" }} />
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <span className="inline-block rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">How It Works</span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">From zero to trading in minutes</h2>
        </motion.div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(({ icon: Icon, label, desc }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent font-bold text-lg">{i + 1}</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-muted"><Icon size={18} /></div>
              </div>
              <h3 className="mt-4 font-semibold">{label}</h3>
              <p className="mt-1 text-sm text-muted">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Dashboard Preview ─────────────────────────────────────────────────────────
function DashboardPreview() {
  return (
    <section id="dashboard-preview" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-3xl border border-border bg-surface p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-accent font-semibold">Live Dashboard Preview</p>
              <h3 className="mt-1 text-2xl font-bold">Good afternoon 👋 — here&apos;s today&apos;s opportunity</h3>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-success/15 px-3 py-1.5 text-xs font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <PreviewStat label="Portfolio Value" value="$102,481" tone="success" change="+2.48%" />
            <PreviewStat label="Risk Level" value="Moderate" />
            <PreviewStat label="AI Confidence" value="91%" tone="accent" change="BUY Signal" />
          </div>
          <div className="rounded-2xl border border-border bg-surface-2 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent font-bold text-sm">ETH</div>
                <div>
                  <p className="font-semibold">ETH/USD</p>
                  <p className="text-sm text-success font-medium">BUY · 91% confidence</p>
                </div>
              </div>
              <Link href="/register"
                className="rounded-xl bg-gradient-to-r from-accent to-amber-400 px-4 py-2 text-sm font-semibold text-black hover:shadow-lg hover:shadow-accent/30 transition-all">
                Explain Decision
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PreviewStat({ label, value, tone, change }: { label: string; value: string; tone?: "success" | "accent"; change?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone === "success" ? "text-success" : tone === "accent" ? "text-accent" : "text-foreground"}`}>{value}</p>
      {change && <p className="mt-0.5 text-xs text-muted">{change}</p>}
    </div>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────
function Testimonials() {
  const items = [
    { name: "Alex M.", role: "Beginner Trader", text: "The AI explanations finally made RSI click for me. I've tried 3 other platforms and none explained it this clearly.", stars: 5 },
    { name: "Sarah K.", role: "Finance Student", text: "The autopilot feature is incredible for learning — I can watch exactly why the AI buys or sells and compare it to my own analysis.", stars: 5 },
    { name: "James T.", role: "Crypto Enthusiast", text: "Best demo trading platform I've used. The news sentiment scoring is a feature I didn't know I needed.", stars: 5 },
  ];
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-4xl font-bold tracking-tight">What traders say</h2>
          <p className="mt-3 text-muted">Simulated testimonials for demo purposes</p>
        </motion.div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {items.map((item, i) => (
            <motion.div key={item.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: item.stars }).map((_, j) => (
                  <Star key={j} size={14} className="fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-muted leading-relaxed">&ldquo;{item.text}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-accent text-sm font-bold">{item.name[0]}</div>
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-muted">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Call To Action ────────────────────────────────────────────────────────────
function CallToAction() {
  return (
    <section className="px-6 py-24">
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="mx-auto max-w-3xl relative overflow-hidden rounded-3xl border border-amber-500/20 p-12 text-center">
        {/* Coins background image */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 rounded-3xl"
            style={{ backgroundImage: "url('/trading-coins.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="absolute inset-0 rounded-3xl"
            style={{ background: "color-mix(in srgb, var(--background) 82%, transparent)" }} />
          <div className="absolute inset-0 rounded-3xl"
            style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,158,11,0.15) 0%, transparent 70%)" }} />
        </div>
        <h2 className="text-4xl font-extrabold text-foreground">Ready to trade smarter?</h2>
        <p className="mt-4 text-muted text-lg">No real money, no risk — just a realistic sandbox to learn how an AI-assisted trading desk actually works.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/register"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-accent to-amber-400 px-8 py-3.5 font-semibold text-black shadow-xl shadow-accent/40 hover:shadow-accent/60 transition-all hover:scale-105">
            <span className="flex items-center gap-2">Start Free Demo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
          </Link>
          <Link href="/learn"
            className="flex items-center gap-2 rounded-2xl border border-border bg-surface/80 px-8 py-3.5 font-medium text-foreground hover:bg-surface transition-all">
            <BookOpen size={16} /> Browse Courses
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
