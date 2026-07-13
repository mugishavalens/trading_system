"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { api, AIRecommendation, Candle, SymbolInfo } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Sparkline from "@/components/Sparkline";

const SENTIMENT_META: Record<string, { label: string; icon: typeof TrendingUp; className: string }> = {
  BUY: { label: "Bullish", icon: TrendingUp, className: "text-success bg-success/15" },
  SELL: { label: "Bearish", icon: TrendingDown, className: "text-danger bg-danger/15" },
  HOLD: { label: "Neutral", icon: Minus, className: "text-muted bg-surface-2" },
};

export default function MarketsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [candlesBySymbol, setCandlesBySymbol] = useState<Record<string, Candle[]>>({});
  const [recsBySymbol, setRecsBySymbol] = useState<Record<string, AIRecommendation>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const list = await api.symbols();
      if (cancelled) return;
      setSymbols(list);

      const entries = await Promise.all(
        list.map(async (s) => [s.symbol, await api.candles(s.symbol, 60)] as const)
      );
      if (cancelled) return;
      setCandlesBySymbol(Object.fromEntries(entries));
    }

    load();
    const id = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function loadRecs() {
      const recs = await api.recommendations(token!);
      if (cancelled) return;
      setRecsBySymbol(Object.fromEntries(recs.map((r) => [r.symbol, r])));
    }

    loadRecs();
    const id = setInterval(loadRecs, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  return (
    <div>
      <h1 className="text-xl font-semibold">Markets</h1>
      <p className="mt-1 text-sm text-muted">
        Live-updating demo prices across crypto and equities.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {symbols.map((s) => {
          const candles = candlesBySymbol[s.symbol] ?? [];
          const positive = s.change_pct_24h >= 0;
          const rec = recsBySymbol[s.symbol];
          const meta = rec ? SENTIMENT_META[rec.action] : null;
          const Icon = meta?.icon;
          return (
            <button
              key={s.symbol}
              onClick={() => router.push(`/dashboard?symbol=${encodeURIComponent(s.symbol)}`)}
              className="glass rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide">
                    {s.asset_class}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{s.symbol}</p>
                  <p className="text-xs text-muted">{s.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    ${s.last_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <p className={positive ? "text-success text-sm" : "text-danger text-sm"}>
                    {positive ? "+" : ""}
                    {s.change_pct_24h.toFixed(2)}%
                  </p>
                </div>
              </div>
              {meta && Icon && (
                <span className={clsx("mt-3 flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", meta.className)}>
                  <Icon size={12} /> {meta.label} · {rec.confidence.toFixed(0)}%
                </span>
              )}
              <div className="mt-3">
                <Sparkline
                  values={candles.map((c) => c.close)}
                  positive={positive}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
