"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import { Sparkles, Loader2, ChevronDown, ShieldAlert, Newspaper, Bot, Wand2 } from "lucide-react";
import { AIRecommendation, DebateResult } from "@/lib/api";

const ACTION_STYLES: Record<string, string> = {
  BUY: "bg-success/15 text-success border-success/30",
  SELL: "bg-danger/15 text-danger border-danger/30",
  HOLD: "bg-surface-2 text-muted border-border",
};

const VERDICT_STYLES: Record<string, string> = {
  proceed: "text-success",
  reduce: "text-accent",
  veto: "text-danger",
};

export default function RecommendationCard({
  rec,
  explanation,
  explanationSource,
  explanationStale,
  loadingExplain,
  onExplain,
  debate,
  loadingDebate,
  onShowDebate,
  executing,
  onExecuteAi,
  tradeError,
  onManualTrade,
}: {
  rec: AIRecommendation;
  explanation: string | null;
  explanationSource: string | null;
  explanationStale: boolean;
  loadingExplain: boolean;
  onExplain: () => void;
  debate: DebateResult | null;
  loadingDebate: boolean;
  onShowDebate: () => void;
  executing: boolean;
  onExecuteAi: () => void;
  tradeError: string | null;
  onManualTrade: (side: "BUY" | "SELL", quantity: number, stopLoss?: number, takeProfit?: number, deviation?: number) => void;
}) {
  const [manualQty,  setManualQty]  = useState("0.01");
  const [stopLoss,   setStopLoss]   = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [deviation,  setDeviation]  = useState("");
  const [debateOpen, setDebateOpen] = useState(false);

  // Auto-fill AI-suggested SL/TP whenever recommendation changes
  useEffect(() => {
    if (!rec.indicators?.atr || rec.action === "HOLD") return;
    const atr   = rec.indicators.atr;
    const price = rec.price;
    const sl = rec.action === "BUY"  ? price - 1.5 * atr : price + 1.5 * atr;
    const tp = rec.action === "BUY"  ? price + 2.5 * atr : price - 2.5 * atr;
    setStopLoss(sl.toFixed(5));
    setTakeProfit(tp.toFixed(5));
  }, [rec.symbol, rec.action, rec.price, rec.indicators?.atr]);

  function applyAiLevels() {
    if (!rec.indicators?.atr || rec.action === "HOLD") return;
    const atr   = rec.indicators.atr;
    const price = rec.price;
    setStopLoss((rec.action === "BUY" ? price - 1.5 * atr : price + 1.5 * atr).toFixed(5));
    setTakeProfit((rec.action === "BUY" ? price + 2.5 * atr : price - 2.5 * atr).toFixed(5));
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs text-accent">
            <Sparkles size={14} /> AI Recommendation
          </p>
          <h3 className="mt-1 text-xl font-semibold">{rec.symbol}</h3>
        </div>
        <span
          className={clsx(
            "rounded-full border px-3 py-1 text-sm font-semibold",
            ACTION_STYLES[rec.action]
          )}
        >
          {rec.action}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-muted">Confidence</p>
          <p className="mt-1 text-lg font-semibold text-accent">
            {rec.confidence.toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Risk</p>
          <p className="mt-1 text-lg font-semibold">{rec.risk_level}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Illustrative move</p>
          <p
            className={clsx(
              "mt-1 text-lg font-semibold",
              rec.expected_return_pct >= 0 ? "text-success" : "text-danger"
            )}
          >
            {rec.expected_return_pct >= 0 ? "+" : ""}
            {rec.expected_return_pct.toFixed(2)}%
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-1.5 text-sm text-muted">
        {rec.reasons.map((reason, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-accent">•</span>
            {reason}
          </li>
        ))}
      </ul>

      {explanation && (
        <div className="mt-4 rounded-lg border border-border bg-background/60 p-4 text-sm">
          <p className="text-xs text-accent">
            {explanationSource === "claude" ? "Claude's explanation" : "Explanation"}
          </p>
          {explanationStale && (
            <p className="mt-1 text-xs text-muted">
              Market data has moved since this was generated — the signal above is more current.
            </p>
          )}
          <p className="mt-1.5 text-foreground/90">{explanation}</p>
        </div>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <button
          onClick={() => {
            setDebateOpen((open) => !open);
            if (!debate) onShowDebate();
          }}
          className="flex w-full items-center justify-between text-xs text-muted hover:text-foreground transition-colors"
        >
          <span>Show AI Debate — how the agents reached this call</span>
          <ChevronDown
            size={14}
            className={clsx("transition-transform", debateOpen && "rotate-180")}
          />
        </button>

        {debateOpen && (
          <div className="mt-3 space-y-3">
            {loadingDebate && !debate && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 size={14} className="animate-spin" /> Running the debate...
              </p>
            )}
            {debate && (
              <>
                <div className="flex items-start gap-2 text-sm">
                  <Newspaper size={14} className="mt-0.5 shrink-0 text-muted" />
                  <p>
                    <span className="font-medium">News Agent</span> — {debate.news.lean} (
                    {debate.news.sentiment_score >= 0 ? "+" : ""}
                    {debate.news.sentiment_score.toFixed(2)}): {debate.news.reason}
                  </p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <ShieldAlert size={14} className="mt-0.5 shrink-0 text-muted" />
                  <p>
                    <span className="font-medium">Risk Agent</span> —{" "}
                    <span className={clsx("font-medium uppercase", VERDICT_STYLES[debate.risk.verdict])}>
                      {debate.risk.verdict}
                    </span>
                    : {debate.risk.reason}
                  </p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Bot size={14} className="mt-0.5 shrink-0 text-accent" />
                  <p>
                    <span className="font-medium">Coach</span> — {debate.coach_summary}
                  </p>
                </div>
                {debate.final_action !== debate.market_analyst.action && (
                  <p className="text-xs text-accent">
                    Note: the Risk Agent overrode the Analyst&rsquo;s {debate.market_analyst.action} call —
                    final action is {debate.final_action}.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-muted">{rec.disclaimer}</p>

      {tradeError && <p className="mt-3 text-sm text-danger">{tradeError}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={onExplain}
          disabled={loadingExplain}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface transition-colors disabled:opacity-60"
        >
          {loadingExplain && <Loader2 size={14} className="animate-spin" />}
          Explain Decision
        </button>
        <button
          onClick={onExecuteAi}
          disabled={executing || rec.action === "HOLD"}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-2 transition-colors disabled:opacity-50"
        >
          {executing && <Loader2 size={14} className="animate-spin" />}
          Let AI Execute
        </button>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Manual Trade</p>
        <div className="space-y-3">
          {/* Qty + side */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted">Quantity (lots)</label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={manualQty}
                onChange={(e) => setManualQty(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="0.01"
              />
            </div>
          </div>

          {/* SL / TP / Deviation */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted">Stop Loss</label>
                {rec.action !== "HOLD" && (
                  <button onClick={applyAiLevels} title="Apply AI suggestion" className="text-accent hover:text-accent-2">
                    <Wand2 size={10} />
                  </button>
                )}
              </div>
              <input
                type="number" min="0" step="0.0001" value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 text-xs outline-none focus:border-danger placeholder:text-muted"
                placeholder="not set"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Take Profit</label>
              <input
                type="number" min="0" step="0.0001" value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 text-xs outline-none focus:border-success placeholder:text-muted"
                placeholder="not set"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Deviation</label>
              <input
                type="number" min="0" step="1" value={deviation}
                onChange={(e) => setDeviation(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 text-xs outline-none focus:border-accent placeholder:text-muted"
                placeholder="pips"
              />
            </div>
          </div>

          {/* Price preview */}
          <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
            <span>Current price</span>
            <span className="font-semibold text-foreground">
              ${rec.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
            </span>
          </div>

          {/* Sell / Buy */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onManualTrade("SELL", parseFloat(manualQty), parseFloat(stopLoss) || undefined, parseFloat(takeProfit) || undefined, parseFloat(deviation) || undefined)}
              className="rounded-xl border border-danger/30 bg-danger/10 py-3 text-sm font-bold text-danger hover:bg-danger/20 transition-colors"
            >
              Sell
            </button>
            <button
              onClick={() => onManualTrade("BUY", parseFloat(manualQty), parseFloat(stopLoss) || undefined, parseFloat(takeProfit) || undefined, parseFloat(deviation) || undefined)}
              className="rounded-xl border border-success/30 bg-success/10 py-3 text-sm font-bold text-success hover:bg-success/20 transition-colors"
            >
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
