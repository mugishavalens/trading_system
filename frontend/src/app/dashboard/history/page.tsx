"use client";

import { useEffect, useState } from "react";
import { api, SymbolInfo, Trade } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import FilterBar from "@/components/FilterBar";

const SOURCE_LABEL: Record<string, string> = {
  manual: "Manual",
  ai_auto: "AI (autonomous)",
  assisted: "AI (assisted)",
};

export default function TradeHistoryPage() {
  const { token } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    api.symbols().then(setSymbols);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      const data = await api.tradeHistory(token!, {
        symbol,
        side,
        date_from: dateFrom,
        date_to: dateTo,
      });
      if (!cancelled) setTrades(data);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token, symbol, side, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Trade History</h1>
        <p className="mt-1 text-sm text-muted">
          Every trade on your account, with the AI's own reasoning at the time it was placed.
        </p>
      </div>

      <FilterBar
        selects={[
          { key: "symbol", label: "Symbol", value: symbol, onChange: setSymbol, options: symbols.map((s) => ({ value: s.symbol, label: s.symbol })) },
          { key: "side", label: "Side", value: side, onChange: setSide, options: [{ value: "BUY", label: "Buy" }, { value: "SELL", label: "Sell" }] },
        ]}
        dateRange={{ from: dateFrom, to: dateTo, onFromChange: setDateFrom, onToChange: setDateTo }}
        onClear={() => { setSymbol(""); setSide(""); setDateFrom(""); setDateTo(""); }}
      />

      <div className="space-y-3">
        {trades.map((t) => (
          <div key={t.id} className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                <span className={t.side === "BUY" ? "text-success" : "text-danger"}>
                  {t.side}
                </span>{" "}
                {t.symbol} <span className="text-muted">· Trade #{t.id}</span>
              </p>
              <p className="text-xs text-muted">{new Date(t.executed_at).toLocaleString()}</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted">Quantity</p>
                <p>{t.quantity.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Price</p>
                <p>${t.price.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Result</p>
                {t.realized_pnl != null ? (
                  <p className={t.realized_pnl >= 0 ? "text-success" : "text-danger"}>
                    {t.realized_pnl >= 0 ? "+" : ""}${t.realized_pnl.toFixed(2)}
                  </p>
                ) : (
                  <p className="text-muted">Position open</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted">Source</p>
                <p>{SOURCE_LABEL[t.source] ?? t.source}</p>
              </div>
            </div>

            {t.reason && (
              <div className="mt-3 rounded-lg border border-border bg-background/60 p-3 text-sm text-muted">
                <p className="text-xs font-medium text-foreground">
                  AI reasoning at execution{" "}
                  {t.confidence != null && `(${t.confidence.toFixed(0)}% confidence, ${t.risk_level} risk)`}
                </p>
                <p className="mt-1">{t.reason}</p>
              </div>
            )}
          </div>
        ))}
        {trades.length === 0 && (
          <p className="text-sm text-muted">No trades match these filters.</p>
        )}
      </div>
    </div>
  );
}
