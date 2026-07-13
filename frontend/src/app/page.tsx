"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bot,
  BookOpen,
  Newspaper,
  LineChart,
  ShieldCheck,
  Brain,
  ArrowRight,
  PlayCircle,
} from "lucide-react";

const FEATURES = [
  {
    icon: Bot,
    title: "AI Market Analysis",
    body: "Technical indicators, trend, and volatility fused into one transparent read of the market — every time, every symbol.",
  },
  {
    icon: BookOpen,
    title: "AI Trading Tutor",
    body: "Ask about RSI, Fibonacci, or Smart Money Concepts and get plain-English answers tied to live examples.",
  },
  {
    icon: Newspaper,
    title: "News Intelligence",
    body: "Headlines summarized and scored for sentiment and impact, so you know what's actually moving the market.",
  },
  {
    icon: LineChart,
    title: "Autonomous Demo Trading",
    body: "Let the AI place, manage, and close trades with virtual funds — nothing here ever touches real money.",
  },
  {
    icon: ShieldCheck,
    title: "Risk Management",
    body: "Position sizing, exposure limits, and drawdown protection are baked into every automated decision.",
  },
  {
    icon: Brain,
    title: "Continuous Learning",
    body: "The system tracks its own win rate and reasoning quality over time, in full view of the user.",
  },
];

const STEPS = [
  "Create Account",
  "Learn Trading",
  "Connect Demo Portfolio",
  "AI Analyzes Market",
  "AI Trades Automatically",
  "Review Performance",
];

export default function LandingPage() {
  return (
    <div className="flex-1">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <DashboardPreview />
      <CallToAction />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
            <Bot size={18} />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            AI Trading Mentor
          </span>
        </div>
        <nav className="hidden gap-8 text-sm text-muted md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how-it-works" className="hover:text-foreground">How it Works</a>
          <a href="#dashboard-preview" className="hover:text-foreground">Dashboard</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-muted hover:text-foreground"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-2 transition-colors"
          >
            Start Free Demo
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(245,158,11,0.12) 0%, rgba(2,6,23,0) 70%)",
        }}
      />
      <div className="mx-auto max-w-4xl text-center">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-accent"
        >
          Demo mode · virtual funds only · not financial advice
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl"
        >
          Your AI Trading Partner That{" "}
          <span className="text-accent">Learns, Thinks, and Trades</span>{" "}
          Smarter.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted"
        >
          Learn trading, analyze the market, and let an AI copilot execute
          demo trades with explainable, risk-aware decisions — all in one
          platform.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-black hover:bg-accent-2 transition-colors"
          >
            Start Free Demo <ArrowRight size={16} />
          </Link>
          <a
            href="#dashboard-preview"
            className="flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-medium text-foreground hover:bg-surface transition-colors"
          >
            <PlayCircle size={18} /> Watch Demo
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          An AI copilot for every part of trading
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="glass rounded-2xl p-6 transition-transform hover:-translate-y-1"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          How It Works
        </h2>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {STEPS.map((step, i) => (
            <div key={step} className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/40 bg-surface text-sm font-semibold text-accent">
                {i + 1}
              </div>
              <p className="mt-3 text-sm text-muted">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section id="dashboard-preview" className="px-6 py-20">
      <div className="mx-auto max-w-4xl glass rounded-2xl p-8">
        <p className="text-xs uppercase tracking-wide text-accent">
          Dashboard preview
        </p>
        <h3 className="mt-2 text-2xl font-semibold">
          Good afternoon 👋 — here&apos;s today&apos;s opportunity
        </h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <PreviewStat label="Portfolio" value="$102,481" tone="success" />
          <PreviewStat label="Risk" value="Moderate" />
          <PreviewStat label="AI Confidence" value="91%" tone="accent" />
        </div>
        <div className="mt-6 rounded-xl border border-border bg-background/60 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">ETH/USD</p>
              <p className="text-sm text-success">BUY · 91% confidence</p>
            </div>
            <Link
              href="/register"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-2"
            >
              Explain Decision
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "accent";
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold ${
          tone === "success"
            ? "text-success"
            : tone === "accent"
            ? "text-accent"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function CallToAction() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-3xl rounded-2xl border border-accent/30 bg-gradient-to-b from-accent/10 to-transparent p-10 text-center">
        <h2 className="text-3xl font-bold">Ready to trade smarter, safely?</h2>
        <p className="mt-3 text-muted">
          No real money, no risk — just a realistic sandbox to learn how an
          AI-assisted trading desk actually works.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-black hover:bg-accent-2 transition-colors"
        >
          Start Free Demo <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-10 text-sm text-muted">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p>© {new Date().getFullYear()} AI Trading Mentor — Demo Project</p>
        <p>
          Educational demo only. Not financial advice. No real funds are ever
          used.
        </p>
      </div>
    </footer>
  );
}
