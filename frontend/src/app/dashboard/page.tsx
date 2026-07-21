"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bot, Check, Maximize2, Minimize2, Sparkles, X } from "lucide-react";
import {
  api,
  AIRecommendation,
  ApiError,
  Candle,
  DebateResult,
  NewsItem,
  Order,
  PendingTrade,
  Portfolio,
  SymbolInfo,
  Trade,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import StatCard from "@/components/StatCard";
import SymbolTabs from "@/components/SymbolTabs";
import PriceChart from "@/components/PriceChart";
import RecommendationCard, { ManualTradeOptions } from "@/components/RecommendationCard";
import PositionsTable from "@/components/PositionsTable";
import TradeHistoryTable from "@/components/TradeHistoryTable";
import OrdersTable from "@/components/OrdersTable";
import PriceAlerts from "@/components/PriceAlerts";
import PaymentSection from "@/components/PaymentSection";

const POLL_MS = 6000;

const MODE_LABEL: Record<string, string> = {
  manual: "Manual — you place every trade",
  assisted: "Assisted — approve or reject AI proposals",
  autonomous: "Autonomous — trading on your behalf",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { token, user, refreshUser } = useAuth();
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

  const [debate, setDebate] = useState<DebateResult | null>(null);
  const [loadingDebate, setLoadingDebate] = useState(false);

  const [executing, setExecuting] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  const [pending, setPending] = useState<PendingTrade[]>([]);
  const [pendingBusyId, setPendingBusyId] = useState<number | null>(null);
  const [pendingErrors, setPendingErrors] = useState<Record<number, string>>({});
  const [pendingQtyOverrides, setPendingQtyOverrides] = useState<Record<number, string>>({});

  const [news, setNews] = useState<NewsItem[]>([]);
  const [chartExpanded, setChartExpanded] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setChartExpanded(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const refreshPending = useCallback(async () => {
    if (!token) return;
    setPending(await api.pendingTrades(token));
  }, [token]);

  const refreshOrders = useCallback(async () => {
    if (!token) return;
    setOrders(await api.listOrders(token));
  }, [token]);

  useEffect(() => {
    refreshMarket();
    const id = setInterval(refreshMarket, POLL_MS);
    return () => clearInterval(id);
  }, [refreshMarket]);

  useEffect(() => {
    setExplanation(null);
    setExplanationSource(null);
    setDebate(null);
    refreshSymbolData();
    const id = setInterval(refreshSymbolData, POLL_MS);
    return () => clearInterval(id);
  }, [refreshSymbolData]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function loadNews() {
      const items = await api.news(50);
      if (!cancelled) setNews(items);
    }
    loadNews();
    const id = setInterval(loadNews, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  useEffect(() => {
    refreshAccount();
    // Positions can now close themselves (stop-loss/take-profit) and orders can
    // fill in the background via the monitor loop, not just from user actions —
    // needs a poll, not just a refresh-on-demand, to show up live.
    const id = setInterval(refreshAccount, POLL_MS);
    return () => clearInterval(id);
  }, [refreshAccount]);

  useEffect(() => {
    if (user?.trading_mode !== "assisted") return;
    refreshPending();
    const id = setInterval(refreshPending, POLL_MS);
    return () => clearInterval(id);
  }, [refreshPending, user?.trading_mode]);

  useEffect(() => {
    refreshOrders();
    const id = setInterval(refreshOrders, POLL_MS);
    return () => clearInterval(id);
  }, [refreshOrders]);

  async function handleCancelOrder(id: number) {
    if (!token) return;
    await api.cancelOrder(token, id);
    await refreshOrders();
  }

  async function handleClosePosition(symbol: string, quantity: number) {
    if (!token) return;
    await api.executeTrade(token, { symbol, side: "SELL", quantity });
    await Promise.all([refreshAccount(), refreshUser()]);
  }

  async function handleUpdatePositionSlTp(
    symbol: string,
    stopLoss: number | null,
    takeProfit: number | null
  ) {
    if (!token) return;
    await api.updatePosition(token, symbol, { stop_loss: stopLoss, take_profit: takeProfit });
    await refreshAccount();
  }

  async function handleApprovePending(id: number, quantity?: number) {
    if (!token) return;
    setPendingBusyId(id);
    // Clear any previous error for this trade
    setPendingErrors((prev) => { const next = { ...prev }; delete next[id]; return next; });
    try {
      await api.approvePendingTrade(token, id, quantity);
      await Promise.all([refreshPending(), refreshAccount(), refreshUser()]);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to approve trade.";
      setPendingErrors((prev) => ({ ...prev, [id]: msg }));
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setPendingErrors((prev) => { const next = { ...prev }; delete next[id]; return next; });
      }, 5000);
    } finally {
      setPendingBusyId(null);
    }
  }

  async function handleRejectPending(id: number) {
    if (!token) return;
    setPendingBusyId(id);
    try {
      await api.rejectPendingTrade(token, id);
      await refreshPending();
    } finally {
      setPendingBusyId(null);
    }
  }

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

  async function handleShowDebate() {
    if (!token) return;
    setLoadingDebate(true);
    try {
      setDebate(await api.debate(token, selected));
    } catch {
      // Debate is a supplementary view — leave the recommendation card usable if it fails.
    } finally {
      setLoadingDebate(false);
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

  async function handleManualTrade(side: "BUY" | "SELL", quantity: number, opts: ManualTradeOptions) {
    if (!token || !quantity || quantity <= 0) return;
    setExecuting(true);
    setTradeError(null);
    try {
      if (opts.orderType === "market") {
        await api.executeTrade(token, {
          symbol: selected, side, quantity,
          stop_loss: opts.stopLoss, take_profit: opts.takeProfit, deviation: opts.deviation,
          reference_price: recommendation?.price,
        });
        await Promise.all([refreshAccount(), refreshUser()]);
      } else {
        if (!opts.triggerPrice) {
          setTradeError("Set a trigger price for a limit/stop order.");
          return;
        }
        await api.createOrder(token, {
          symbol: selected, side, order_type: opts.orderType, trigger_price: opts.triggerPrice, quantity,
          stop_loss: opts.stopLoss, take_profit: opts.takeProfit, deviation: opts.deviation,
        });
        await refreshOrders();
      }
    } catch (err) {
      setTradeError(err instanceof ApiError ? err.message : "Trade failed.");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="space-y-6">
      {user && (
        <Link
          href="/dashboard/settings"
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
            user.trading_mode !== "manual"
              ? "border-accent/30 bg-accent/10 hover:bg-accent/15"
              : "border-border bg-surface hover:bg-surface-2"
          }`}
        >
          <span className="flex items-center gap-2">
            <Bot size={16} className={user.trading_mode !== "manual" ? "text-accent" : "text-muted"} />
            <span className={user.trading_mode !== "manual" ? "text-accent font-medium" : "text-muted"}>
              Trading Mode: {MODE_LABEL[user.trading_mode]}
            </span>
          </span>
          <span className="text-xs text-muted underline">Manage in Settings</span>
        </Link>
      )}

      {user?.trading_mode === "assisted" && pending.length > 0 && (
        <div className="glass rounded-2xl border-2 border-accent/30 p-5">
          <p className="flex items-center gap-2 font-semibold">
            <Sparkles size={16} className="text-accent" /> Awaiting your approval
          </p>
          <div className="mt-3 space-y-3">
            {pending.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-border bg-background/60 overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div>
                    <p className="text-sm">
                      <span className={p.side === "BUY" ? "text-success" : "text-danger"}>
                        {p.side}
                      </span>{" "}
                      <span className="font-medium">{p.symbol}</span> ·{" "}
                      {p.confidence.toFixed(0)}% confidence · {p.risk_level} risk
                    </p>
                    <p className="mt-1 text-xs text-muted">{p.reason}</p>
                    <label className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                      Qty
                      <input
                        type="number" min="0" step="0.0001"
                        value={pendingQtyOverrides[p.id] ?? p.quantity}
                        onChange={(e) =>
                          setPendingQtyOverrides((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        className="w-24 rounded border border-border bg-surface px-1.5 py-0.5 text-xs outline-none focus:border-accent"
                      />
                      <span className="text-muted/70">(AI proposed {p.quantity.toFixed(4)})</span>
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleApprovePending(p.id, parseFloat(pendingQtyOverrides[p.id] ?? String(p.quantity)))
                      }
                      disabled={pendingBusyId === p.id}
                      className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-black hover:bg-accent-2 disabled:opacity-50 transition-colors"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleRejectPending(p.id)}
                      disabled={pendingBusyId === p.id}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface disabled:opacity-50 transition-colors"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
                {pendingErrors[p.id] && (
                  <div className="flex items-center justify-between gap-2 border-t border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                    <span>⚠ {pendingErrors[p.id]}</span>
                    <button
                      onClick={() =>
                        setPendingErrors((prev) => {
                          const next = { ...prev };
                          delete next[p.id];
                          return next;
                        })
                      }
                      className="ml-2 rounded p-0.5 hover:bg-danger/20 transition-colors"
                      aria-label="Dismiss error"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
          <div className={`glass rounded-2xl p-4 transition-all duration-300 ${chartExpanded ? "fixed inset-4 z-50 overflow-auto shadow-2xl" : ""}`}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-muted">{selected} — Price Chart</p>
            </div>
            {candles.length > 0 ? (
              <PriceChart candles={candles} expanded={chartExpanded} />
            ) : (
              <div className="flex h-80 items-center justify-center text-muted">
                Loading chart...
              </div>
            )}
            {/* Expand button sits below the chart, never overlapping it */}
            <div className="mt-3 flex justify-center">
              <button
                onClick={() => setChartExpanded((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-foreground transition-colors"
                title={chartExpanded ? "Collapse chart" : "Expand chart"}
              >
                {chartExpanded ? (
                  <><Minimize2 size={13} /> Collapse</>
                ) : (
                  <><Maximize2 size={13} /> Expand</>
                )}
              </button>
            </div>
          </div>
          {/* Backdrop overlay when chart is expanded */}
          {chartExpanded && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setChartExpanded(false)}
            />
          )}

          <div className="glass rounded-2xl">
            <div className="border-b border-border px-5 py-3 text-sm font-medium">
              Open Positions
            </div>
            <PositionsTable
              positions={portfolio?.positions ?? []}
              onClose={handleClosePosition}
              onUpdateSlTp={handleUpdatePositionSlTp}
            />
          </div>

          <div className="glass rounded-2xl">
            <div className="border-b border-border px-5 py-3 text-sm font-medium">
              Open Orders
            </div>
            <OrdersTable orders={orders} onCancel={handleCancelOrder} />
          </div>

          <PriceAlerts defaultSymbol={selected} />

          <div className="glass rounded-2xl">
            <div className="border-b border-border px-5 py-3 text-sm font-medium">
              Trade History
            </div>
            <TradeHistoryTable trades={trades} />
          </div>
        </div>

        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
            <Sparkles size={14} className="text-accent" /> Your AI Trading Partner
          </p>
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
              debate={debate}
              loadingDebate={loadingDebate}
              onShowDebate={handleShowDebate}
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

          {news.filter((n) => n.symbol === selected).length > 0 && (
            <div className="glass mt-4 rounded-2xl">
              <div className="border-b border-border px-4 py-3 text-sm font-medium">
                Related News — {selected}
              </div>
              <div className="divide-y divide-border">
                {news
                  .filter((n) => n.symbol === selected)
                  .slice(0, 3)
                  .map((n) => (
                    <div key={n.id} className="px-4 py-3">
                      <p className="text-sm">{n.headline}</p>
                      <p className="mt-1 text-xs text-muted">
                        {new Date(n.published_at).toLocaleTimeString()} ·{" "}
                        <span
                          className={
                            n.sentiment === "positive"
                              ? "text-success"
                              : n.sentiment === "negative"
                              ? "text-danger"
                              : "text-muted"
                          }
                        >
                          {n.sentiment}
                        </span>
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Payment & Subscription ── */}
      <div className="glass rounded-2xl p-6">
        <PaymentSection />
      </div>
    </div>
  );
}
