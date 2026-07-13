"use client";

import Link from "next/link";
import { Bot, ShieldCheck, GraduationCap, Sparkles, ArrowRight } from "lucide-react";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";

const VALUES = [
  {
    icon: GraduationCap,
    title: "Teach first",
    body: "Every feature exists to help someone understand markets a little better, not just to execute trades faster.",
  },
  {
    icon: ShieldCheck,
    title: "Honest about uncertainty",
    body: "No signal here is presented as guaranteed. Confidence scores, risk levels, and disclaimers are part of every recommendation, always.",
  },
  {
    icon: Sparkles,
    title: "Explainable by default",
    body: "If the AI can't explain why it made a decision in plain language, that decision isn't shown. Reasoning is a feature, not an afterthought.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex-1">
      <LandingNav />

      <section className="px-6 pt-20 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-accent">
            About this project
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight">
            Trading is intimidating. It shouldn&apos;t be.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            AI Trading Mentor is a demo platform built to show what an
            AI-first, education-focused trading copilot could look like —
            one that teaches as it goes, explains every decision, and never
            touches real money.
          </p>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl glass rounded-2xl p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Bot size={20} />
            </div>
            <h2 className="text-xl font-semibold">Why this exists</h2>
          </div>
          <p className="mt-4 text-muted">
            Most beginners don&apos;t know where to start with trading — which
            indicators matter, how much to risk, or whether a strategy even
            makes sense. At the same time, "AI trading bots" are often sold
            as black boxes that promise guaranteed returns. Neither extreme
            is honest. This project is an attempt at a middle ground: a
            transparent, rule-based AI that shows its work, paired with a
            tutor that explains the concepts behind every decision — all
            running on virtual money so the only thing at risk is your time.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold">What we care about</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="glass rounded-2xl p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-accent/30 bg-gradient-to-b from-accent/10 to-transparent p-10 text-center">
          <h2 className="text-2xl font-bold">Want to see it in action?</h2>
          <p className="mt-3 text-muted">
            Create a free demo account — no real money, no risk, just $100,000
            in virtual funds to learn with.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-black hover:bg-accent-2 transition-colors"
          >
            Start Free Demo <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
