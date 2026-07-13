"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export default function AuthSplit({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-surface p-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 50% at 30% 20%, rgba(245,158,11,0.15) 0%, rgba(2,6,23,0) 70%)",
          }}
        />
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
            <Bot size={18} />
          </div>
          <span className="text-lg font-semibold">AI Trading Mentor</span>
        </Link>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass rounded-2xl p-6"
          >
            <p className="text-xs text-accent">AI Recommendation</p>
            <p className="mt-2 text-2xl font-semibold">ETH/USD · BUY</p>
            <p className="mt-1 text-sm text-muted">
              91% confidence · bullish trend, positive news, RSI recovering
            </p>
            <div className="mt-4 flex gap-2">
              {[40, 70, 55, 90, 65, 80, 95].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.1 * i, duration: 0.5 }}
                  className="w-4 rounded-t bg-accent/70"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </motion.div>
          <p className="relative z-10 mt-6 max-w-sm text-sm text-muted">
            Every AI decision comes with a confidence score, a reason, and a
            reminder that markets are uncertain — never a guarantee.
          </p>
        </div>

        <p className="relative z-10 text-xs text-muted">
          Demo platform · virtual funds only
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
