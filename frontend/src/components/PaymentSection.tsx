"use client";

import { useState } from "react";
import {
  CreditCard,
  Wallet,
  ShieldCheck,
  Zap,
  Check,
  Lock,
  ArrowRight,
  BadgePercent,
  CircleDollarSign,
} from "lucide-react";
import clsx from "clsx";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$9",
    period: "/mo",
    description: "Great for getting started with AI-assisted trading.",
    features: [
      "5 AI trade recommendations / day",
      "1 active symbol",
      "Basic risk analysis",
      "Email support",
    ],
    cta: "Get Started",
    accent: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For serious traders who want full AI autonomy.",
    features: [
      "Unlimited AI recommendations",
      "All symbols & pairs",
      "Autonomous trading mode",
      "AI Debate & Coach agents",
      "Priority support",
    ],
    cta: "Go Pro",
    accent: true,
    badge: "Most Popular",
  },
  {
    id: "elite",
    name: "Elite",
    price: "$79",
    period: "/mo",
    description: "Maximum edge with advanced analytics and dedicated support.",
    features: [
      "Everything in Pro",
      "Portfolio risk dashboard",
      "Custom AI engine config",
      "Dedicated account manager",
      "Early access to new features",
    ],
    cta: "Go Elite",
    accent: false,
  },
];

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
  { id: "crypto", label: "Crypto Wallet", icon: Wallet },
  { id: "paypal", label: "PayPal", icon: CircleDollarSign },
];

export default function PaymentSection() {
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");
  const [selectedMethod, setSelectedMethod] = useState<string>("card");

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Upgrade Your Plan</h2>
          <p className="mt-0.5 text-sm text-muted">
            Unlock more AI power — cancel any time, no hidden fees.
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
          <BadgePercent size={13} /> 20% off annual
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={clsx(
              "relative rounded-2xl border p-5 text-left transition-all duration-200 focus:outline-none",
              selectedPlan === plan.id
                ? plan.accent
                  ? "border-accent bg-accent/10 shadow-lg shadow-accent/10"
                  : "border-border bg-surface-2 shadow-md"
                : "border-border bg-surface hover:bg-surface-2"
            )}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-black">
                {plan.badge}
              </span>
            )}

            <div className="flex items-start justify-between">
              <p className={clsx("font-semibold", plan.accent ? "text-accent" : "")}>
                {plan.name}
              </p>
              {selectedPlan === plan.id && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                  <Check size={12} className="text-black" />
                </span>
              )}
            </div>

            <p className="mt-2">
              <span className="text-2xl font-bold">{plan.price}</span>
              <span className="text-sm text-muted">{plan.period}</span>
            </p>

            <p className="mt-1.5 text-xs text-muted">{plan.description}</p>

            <ul className="mt-4 space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-muted">
                  <Zap size={11} className="mt-0.5 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Payment method */}
      <div className="glass rounded-2xl p-6">
        <p className="mb-4 text-sm font-medium">Payment Method</p>
        <div className="flex flex-wrap gap-3">
          {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedMethod(id)}
              className={clsx(
                "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none",
                selectedMethod === id
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface text-muted hover:bg-surface-2"
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Card form placeholder */}
        {selectedMethod === "card" && (
          <div className="mt-5 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-muted">Cardholder Name</label>
                <input
                  disabled
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm text-muted placeholder:text-muted/50 outline-none cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">Card Number</label>
                <input
                  disabled
                  placeholder="•••• •••• •••• ••••"
                  className="w-full rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm text-muted placeholder:text-muted/50 outline-none cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">Expiry</label>
                <input
                  disabled
                  placeholder="MM / YY"
                  className="w-full rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm text-muted placeholder:text-muted/50 outline-none cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted">CVV</label>
                <input
                  disabled
                  placeholder="•••"
                  className="w-full rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm text-muted placeholder:text-muted/50 outline-none cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Crypto placeholder */}
        {selectedMethod === "crypto" && (
          <div className="mt-5 rounded-xl border border-border bg-background/60 p-5 text-center">
            <Wallet size={32} className="mx-auto text-muted" />
            <p className="mt-2 text-sm text-muted">
              Crypto payments coming soon — connect your wallet here.
            </p>
          </div>
        )}

        {/* PayPal placeholder */}
        {selectedMethod === "paypal" && (
          <div className="mt-5 rounded-xl border border-border bg-background/60 p-5 text-center">
            <CircleDollarSign size={32} className="mx-auto text-muted" />
            <p className="mt-2 text-sm text-muted">
              PayPal integration coming soon.
            </p>
          </div>
        )}

        {/* Summary + CTA */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <div className="text-sm">
            <p className="text-muted">Selected plan</p>
            <p className="font-semibold">
              {PLANS.find((p) => p.id === selectedPlan)?.name ?? "—"} —{" "}
              <span className="text-accent">
                {PLANS.find((p) => p.id === selectedPlan)?.price}
                {PLANS.find((p) => p.id === selectedPlan)?.period}
              </span>
            </p>
          </div>
          <button
            disabled
            className="flex cursor-not-allowed items-center gap-2 rounded-xl bg-accent/50 px-6 py-3 text-sm font-semibold text-black/60"
            title="Payment not yet active — coming soon"
          >
            <Lock size={14} />
            {PLANS.find((p) => p.id === selectedPlan)?.cta ?? "Subscribe"}
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Trust badges */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-success" /> SSL encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <Lock size={13} className="text-success" /> PCI-DSS compliant
          </span>
          <span className="flex items-center gap-1.5">
            <Check size={13} className="text-success" /> Cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
}
