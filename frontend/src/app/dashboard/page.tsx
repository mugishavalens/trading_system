"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  api,
  AIRecommendation,
  ApiError,
  Candle,
  Portfolio,
  SymbolInfo,
  Trade,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import StatCard from "@/components/StatCard";
import SymbolTabs from "@/components/SymbolTabs";
import PriceChart from "@/components/PriceChart";
import RecommendationCard from "@/components/RecommendationCard";
import PositionsTable from "@/components/PositionsTable";
import TradeHistoryTable from "@/components/TradeHistoryTable";

const POLL_MS = 6000;

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { token, refreshUser } = useAuth();
  const searchParams = useSearchParams();

  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [selected, setSelected] = useState<string>(
    () => searchParams.get("symbol") ?? "BTC/USD"
  );
  const [candles, setCandles] = useState<Candle[]>([]);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);

  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationSource, setExplanationSource] = useState<string | null>(null);
  const [explainedAction, setExplainedAction] = useState<string | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);

  const [executing, setExecuting] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  const refreshMarket = useCallback(async () => {
    const list = await api.symbols();
    setSymbols(list);
  }, []);

  const refreshSymbolData = useCallback(async () => {
    if (!token) return;
    const [candleData, rec] = await Promise.all([
      api.candles(selected, 120),
      api.recommendation(token, selected),
    ]);
    setCandles(candleData);
    setRecommendation(rec);
  }, [token, selected]);

  const refreshAccount = useCallback(async () => {
    if (!token) return;
    const [p, h] = await Promise.all([
      api.portfolio(token),
      api.tradeHistory(token),
    ]);
    setPortfolio(p);
    setTrades(h);
  }, [token]);

  useEffect(() => {
    refreshMarket();
    const id = setInterval(refreshMarket, POLL_MS);
    return () => clearInterval(id);
  }, [refreshMarket]);

  useEffect(() => {
    setExplanation(null);
    setExplanationSource(null);
    refreshSymbolData();
    const id = setInterval(refreshSymbolData, POLL_MS);
    return () => clearInterval(id);
  }, [refreshSymbolData]);

  useEffect(() => {
    refreshAccount();
  }, [refreshAccount]);

  async function handleExplain() {
    if (!token) return;
    setLoadingExplain(true);
    try {
      const res = await api.explain(token, selected);
      setExplanation(res.explanation);
      setExplanationSource(res.generated_by);
      setExplainedAction(recommendation?.action ?? null);
    } catch (err) {
      setExplanation(
        err instanceof ApiError ? err.message : "Could not generate an explanation."
      );
    } finally {
      setLoadingExplain(false);
    }
  }

  async function handleExecuteAi() {
    if (!token) return;
    setExecuting(true);
    setTradeError(null);
    try {
      await api.executeAiTrade(token, selected);
      await Promise.all([refreshAccount(), refreshUser()]);
    } catch (err) {
      setTradeError(err instanceof ApiError ? err.message : "Trade failed.");
    } finally {
      setExecuting(false);
    }
  }

  async function handleManualTrade(side: "BUY" | "SELL", quantity: number) {
    if (!token || !quantity || quantity <= 0) return;
    setExecuting(true);
    setTradeError(null);
    try {
      await api.executeTrade(token, { symbol: selected, side, quantity });
      await Promise.all([refreshAccount(), refreshUser()]);
    } catch (err) {
      setTradeError(err instanceof ApiError ? err.message : "Trade failed.");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Portfolio Equity"
          value={portfolio ? `$${portfolio.equity.toLocaleString()}` : "—"}
        />
        <StatCard
          label="Total P&L"
          value={portfolio ? `${portfolio.total_pnl >= 0 ? "+" : ""}$${portfolio.total_pnl.toFixed(2)}` : "—"}
          tone={portfolio && portfolio.total_pnl >= 0 ? "success" : "danger"}
          hint={portfolio ? `${portfolio.total_pnl_pct.toFixed(2)}%` : undefined}
        />
        <StatCard
          label="AI Confidence"
          value={recommendation ? `${recommendation.confidence.toFixed(0)}%` : "—"}
          tone="accent"
        />
        <StatCard
          label="Risk Score"
          value={portfolio?.risk_score ?? "—"}
        />
        <StatCard
          label="Win Rate"
          value={portfolio ? `${portfolio.win_rate.toFixed(1)}%` : "—"}
        />
      </div>

      <SymbolTabs symbols={symbols} selected={selected} onSelect={setSelected} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-4">
            {candles.length > 0 ? (
              <PriceChart candles={candles} />
            ) : (
              <div className="flex h-80 items-center justify-center text-muted">
                Loading chart...
              </div>
            )}
          </div>

          <div className="glass rounded-2xl">
            <div className="border-b border-border px-5 py-3 text-sm font-medium">
              Open Positions
            </div>
            <PositionsTable positions={portfolio?.positions ?? []} />
          </div>

          <div className="glass rounded-2xl">
            <div className="border-b border-border px-5 py-3 text-sm font-medium">
              Trade History
            </div>
            <TradeHistoryTable trades={trades} />
          </div>
        </div>

        <div>
          {recommendation ? (
            <RecommendationCard
              rec={recommendation}
              explanation={explanation}
              explanationSource={explanationSource}
              explanationStale={
                explanation !== null && explainedAction !== recommendation.action
              }
              loadingExplain={loadingExplain}
              onExplain={handleExplain}
              executing={executing}
              onExecuteAi={handleExecuteAi}
              tradeError={tradeError}
              onManualTrade={handleManualTrade}
            />
          ) : (
            <div className="glass flex h-64 items-center justify-center rounded-2xl text-muted">
              Analyzing market...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
