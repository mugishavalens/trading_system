"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper, TrendingUp, TrendingDown, Minus, RefreshCw,
  X, ExternalLink, Clock, Zap, ChevronRight,
} from "lucide-react";
import LandingNav from "@/components/LandingNav";
import LandingFooter from "@/components/LandingFooter";
import { api, NewsItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AuthGate from "@/components/AuthGate";

/* ─── Sentiment config ─────────────────────────────────────────────────────── */
const SENTIMENT_CONFIG = {
  positive: {
    label: "Positive", icon: TrendingUp,
    color: "text-success", bg: "bg-success/15 border-success/30",
    glow: "shadow-success/20", bar: "bg-success",
  },
  negative: {
    label: "Negative", icon: TrendingDown,
    color: "text-danger", bg: "bg-danger/15 border-danger/30",
    glow: "shadow-danger/20", bar: "bg-danger",
  },
  neutral: {
    label: "Neutral", icon: Minus,
    color: "text-muted", bg: "bg-surface-2 border-border",
    glow: "", bar: "bg-muted",
  },
};

const SYMBOLS = ["All", "BTC/USD", "ETH/USD", "SOL/USD", "AAPL", "TSLA"];

const FALLBACK_NEWS: NewsItem[] = [
  { id: "f1", symbol: "BTC/USD", asset_name: "Bitcoin", headline: "Bitcoin rallies as institutional demand strengthens", summary: "Bitcoin is attracting strong buying interest today, with on-chain data showing increased accumulation by large wallets and improving momentum indicators. Analysts point to renewed ETF inflows and a tightening supply dynamic as the primary catalysts. The relative strength index has crossed back above 50, signalling a shift in short-term momentum from bearish to neutral-bullish.", sentiment: "positive", impact_score: 8, published_at: new Date(Date.now() - 900_000).toISOString() },
  { id: "f2", symbol: "ETH/USD", asset_name: "Ethereum", headline: "Ethereum consolidates near key support as market awaits catalyst", summary: "ETH is trading sideways near the $3,200 level with no clear directional catalyst. Traders are watching the next Federal Reserve announcement closely, with many expecting volatility to remain suppressed until macro clarity emerges. On-chain activity shows steady gas usage, suggesting underlying network demand remains healthy despite the price stagnation.", sentiment: "neutral", impact_score: 4, published_at: new Date(Date.now() - 1_800_000).toISOString() },
  { id: "f3", symbol: "AAPL", asset_name: "Apple", headline: "Apple slides on profit-taking after recent all-time highs", summary: "AAPL is facing selling pressure today as investors lock in gains following a strong run. Analysts flag near-term resistance at the $220 level and warn that the stock is technically overbought on a weekly timeframe. The broader technology sector is also under pressure, with rising yields weighing on growth valuations.", sentiment: "negative", impact_score: 6, published_at: new Date(Date.now() - 2_700_000).toISOString() },
  { id: "f4", symbol: "SOL/USD", asset_name: "Solana", headline: "Solana breaks above key resistance with rising volume", summary: "SOL has cleared a significant technical resistance level on above-average volume, suggesting renewed bullish momentum in the short term. Network activity metrics are also improving, with daily active addresses and transaction counts trending higher. DeFi total value locked on Solana has increased 12% over the past week, adding further fundamental support.", sentiment: "positive", impact_score: 9, published_at: new Date(Date.now() - 3_600_000).toISOString() },
  { id: "f5", symbol: "TSLA", asset_name: "Tesla", headline: "Tesla holds steady ahead of quarterly earnings report", summary: "TSLA is little changed as investors await the upcoming earnings release. Analyst estimates are mixed, with delivery numbers the key focus after a weaker-than-expected prior quarter. Options markets are pricing in a roughly 8% implied move around the announcement, reflecting elevated uncertainty.", sentiment: "neutral", impact_score: 5, published_at: new Date(Date.now() - 5_400_000).toISOString() },
  { id: "f6", symbol: "BTC/USD", asset_name: "Bitcoin", headline: "Broader crypto market jitters weigh on Bitcoin price", summary: "Bitcoin is facing mild selling pressure as macro uncertainty and a stronger US dollar weigh on risk assets across the board. The DXY index has climbed to a two-week high, historically a headwind for crypto. Short-term holders appear to be reducing exposure, though long-term holder cohorts remain unmoved.", sentiment: "negative", impact_score: 7, published_at: new Date(Date.now() - 7_200_000).toISOString() },
];

export default function NewsPage() {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState("All");
  const [sentiment, setSentiment] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);

  async function load(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await api.news(60);
      if (data && data.length > 0) setNews(data);
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filtered = news
    .filter((n) => symbol === "All" || n.symbol === symbol)
    .filter((n) => sentiment === "All" || n.sentiment === sentiment);

  return (
    <div className="flex-1">
      <LandingNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 pt-24 pb-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(139,92,246,0.12) 0%, var(--background) 70%)" }} />
        <div className="mx-auto max-w-4xl text-center">
          <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-400">
            <Newspaper size={12} /> Market Intelligence
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-6 text-5xl font-extrabold tracking-tight">
            Market{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              News & Sentiment
            </span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-muted">
            AI-scored headlines — know what&apos;s moving the market before you trade.
          </motion.p>
        </div>
      </section>

      {/* ── Filters ── */}
      <section className="px-6 pb-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {SYMBOLS.map((s) => (
                <button key={s} onClick={() => setSymbol(s)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    symbol === s
                      ? "bg-accent text-black shadow-lg shadow-accent/30"
                      : "border border-border bg-surface text-muted hover:text-foreground hover:bg-surface-2"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {["All", "positive", "negative", "neutral"].map((s) => (
                <button key={s} onClick={() => setSentiment(s)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                    sentiment === s
                      ? "bg-surface-2 text-foreground border border-border"
                      : "text-muted hover:text-foreground"
                  }`}>
                  {s}
                </button>
              ))}
              <button onClick={() => load(true)}
                className="ml-1 flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors">
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── News grid ── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 rounded-3xl border border-border bg-surface animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Newspaper size={32} className="text-muted mb-4" />
              <p className="text-muted">No news found for this filter.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((item, i) => (
                <NewsCard key={item.id} item={item} index={i} onOpen={() => setSelected(item)} />
              ))}
            </div>
          )}
        </div>
      </section>

      <LandingFooter />

      {/* ── Detail modal ── */}
      <AnimatePresence>
        {selected && (
          <NewsModal
            item={selected}
            onClose={() => setSelected(null)}
            onOpenExternal={(url) => {
              if (!user) { setShowAuthGate(true); return; }
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Auth gate ── */}
      {showAuthGate && (
        <AuthGate
          onClose={() => setShowAuthGate(false)}
          message="Sign in to view real market coverage."
        />
      )}
    </div>
  );
}

/* ─── News Card ────────────────────────────────────────────────────────────── */
function NewsCard({ item, index, onOpen }: { item: NewsItem; index: number; onOpen: () => void }) {
  const cfg = SENTIMENT_CONFIG[item.sentiment];
  const Icon = cfg.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onOpen}
      className="group w-full text-left rounded-3xl border border-border bg-surface p-5 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {/* Top row */}
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

      {/* Headline */}
      <h3 className="mt-3 text-sm font-semibold leading-snug group-hover:text-accent transition-colors line-clamp-2">
        {item.headline}
      </h3>

      {/* Summary preview */}
      <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-2">
        {item.summary}
      </p>

      {/* Bottom row */}
      <div className="mt-4 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-muted">
          <Clock size={10} />
          {new Date(item.published_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          {" · "}
          {new Date(item.published_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>

        <div className="flex items-center gap-2">
          {/* Impact bar */}
          <div className="h-1.5 w-14 rounded-full bg-surface-2 overflow-hidden">
            <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${item.impact_score * 10}%` }} />
          </div>
          <span className="flex items-center gap-0.5 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            Read more <ChevronRight size={11} />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* ─── News Detail Modal ────────────────────────────────────────────────────── */
function NewsModal({ item, onClose, onOpenExternal }: {
  item: NewsItem;
  onClose: () => void;
  onOpenExternal: (url: string) => void;
}) {
  const cfg = SENTIMENT_CONFIG[item.sentiment];
  const Icon = cfg.icon;
  const googleNewsUrl = `https://news.google.com/search?q=${encodeURIComponent(item.asset_name + " " + item.headline.split(" ").slice(0, 4).join(" "))}&hl=en`;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        className="fixed inset-x-4 bottom-0 top-auto z-50 mx-auto max-w-2xl rounded-t-3xl border border-border bg-surface pb-8 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:w-full"
      >
        {/* Drag handle (mobile) */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-lg bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent">{item.symbol}</span>
            <span className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
              <Icon size={10} /> {cfg.label}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted">
              <Zap size={10} className="text-accent" />
              Impact {item.impact_score}/10
            </span>
          </div>
          <button onClick={onClose}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted hover:text-foreground hover:bg-surface-2 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pt-5">
          <h2 className="text-xl font-bold leading-snug">{item.headline}</h2>

          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <Clock size={11} />
            {new Date(item.published_at).toLocaleString(undefined, {
              weekday: "short", month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>

          <p className="mt-4 text-sm text-muted leading-relaxed">{item.summary}</p>

          {/* Impact breakdown */}
          <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">AI Impact Analysis</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-background overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.impact_score * 10}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${cfg.bar}`}
                />
              </div>
              <span className={`text-lg font-extrabold ${item.impact_score >= 7 ? "text-danger" : item.impact_score >= 4 ? "text-accent" : "text-muted"}`}>
                {item.impact_score}<span className="text-sm font-normal text-muted">/10</span>
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">
              {item.impact_score >= 7
                ? "High impact — this event may cause significant price movement."
                : item.impact_score >= 4
                ? "Moderate impact — worth monitoring but not necessarily trade-altering."
                : "Low impact — informational context with limited near-term price effect."}
            </p>
          </div>

          {/* External link — opens new tab, auth-gated for guests */}
          <button
            onClick={() => onOpenExternal(googleNewsUrl)}
            className="mt-4 flex w-full items-center justify-between rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm hover:border-accent/40 hover:bg-surface transition-all group"
          >
            <span className="text-muted group-hover:text-foreground transition-colors">
              See real {item.asset_name} coverage on Google News
            </span>
            <ExternalLink size={14} className="text-accent shrink-0" />
          </button>
        </div>
      </motion.div>
    </>
  );
}
