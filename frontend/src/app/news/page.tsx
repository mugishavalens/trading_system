"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, TrendingUp, TrendingDown, Minus, RefreshCw, Filter } from "lucide-react";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";
import { api, NewsItem } from "@/lib/api";

const SENTIMENT_CONFIG = {
  positive: { label: "Positive", icon: TrendingUp, color: "text-success", bg: "bg-success/15 border-success/30" },
  negative: { label: "Negative", icon: TrendingDown, color: "text-danger", bg: "bg-danger/15 border-danger/30" },
  neutral: { label: "Neutral", icon: Minus, color: "text-muted", bg: "bg-white/10 border-white/10" },
};

const SYMBOLS = ["All", "BTC/USD", "ETH/USD", "SOL/USD", "AAPL", "TSLA"];

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState("All");
  const [sentiment, setSentiment] = useState<string>("All");
  const [refreshing, setRefreshing] = useState(false);

  async function load(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    try {
      // Public endpoint — no token needed
      const data = await api.news(60);
      setNews(data);
    } catch {
      // fallback: show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = news
    .filter((n) => symbol === "All" || n.symbol === symbol)
    .filter((n) => sentiment === "All" || n.sentiment === sentiment);

  return (
    <div className="flex-1">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(139,92,246,0.12) 0%, var(--background) 70%)",
          }}
        />
        <div className="mx-auto max-w-4xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-400"
          >
            <Newspaper size={12} /> Market Intelligence
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-5xl font-extrabold tracking-tight"
          >
            Market{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              News & Sentiment
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-muted"
          >
            AI-scored headlines — know what&apos;s moving the market before you trade.
          </motion.p>
        </div>
      </section>

      {/* Filters */}
      <section className="px-6 pb-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {SYMBOLS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSymbol(s)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    symbol === s
                      ? "bg-accent text-black shadow-lg shadow-accent/30"
                      : "border border-white/10 bg-white/5 text-muted hover:text-foreground hover:bg-white/10"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {["All", "positive", "negative", "neutral"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSentiment(s)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                    sentiment === s
                      ? "bg-surface-2 text-foreground border border-white/20"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={() => load(true)}
                className="ml-2 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
              >
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* News grid */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 rounded-3xl border border-white/10 bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Newspaper size={32} className="text-muted mb-4" />
              <p className="text-muted">No news found for this filter.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item, i) => {
                const cfg = SENTIMENT_CONFIG[item.sentiment];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-lg bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent">
                          {item.symbol}
                        </span>
                        <span className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          <Icon size={10} /> {cfg.label}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted">Impact</p>
                        <p className={`text-sm font-bold ${item.impact_score >= 7 ? "text-danger" : item.impact_score >= 4 ? "text-accent" : "text-muted"}`}>
                          {item.impact_score}/10
                        </p>
                      </div>
                    </div>

                    <h3 className="mt-3 text-sm font-semibold leading-snug group-hover:text-accent transition-colors">
                      {item.headline}
                    </h3>
                    <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-3">
                      {item.summary}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-muted">
                        {new Date(item.published_at).toLocaleDateString(undefined, {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      {/* Impact bar */}
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 rounded-full bg-white/10">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              item.impact_score >= 7 ? "bg-danger" : item.impact_score >= 4 ? "bg-accent" : "bg-muted"
                            }`}
                            style={{ width: `${item.impact_score * 10}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
