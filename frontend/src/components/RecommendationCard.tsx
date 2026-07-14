"use client";

import { useState } from "react";
import clsx from "clsx";
import { Sparkles, Loader2, ChevronDown, ShieldAlert, Newspaper, Bot } from "lucide-react";
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
  onManualTrade: (side: "BUY" | "SELL", quantity: number) => void;
}) {
  const [manualQty, setManualQty] = useState("0.01");
  const [debateOpen, setDebateOpen] = useState(false);

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
        <p className="text-xs text-muted">Or trade manually</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min="0"
            step="0.001"
            value={manualQty}
            onChange={(e) => setManualQty(e.target.value)}
            className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={() => onManualTrade("BUY", parseFloat(manualQty))}
            className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success hover:bg-success/20 transition-colors"
          >
            Buy
          </button>
          <button
            onClick={() => onManualTrade("SELL", parseFloat(manualQty))}
            className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger hover:bg-danger/20 transition-colors"
          >
            Sell
          </button>
        </div>
      </div>
    </div>
  );
}
