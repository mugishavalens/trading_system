"use client";

import { useEffect, useState } from "react";
import { api, AdminTrade, SymbolInfo } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import FilterBar from "@/components/FilterBar";

const PAGE_SIZE = 100;

export default function ActivityLogPage() {
  const { token } = useAuth();
  const [trades, setTrades] = useState<AdminTrade[]>([]);
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState("");
  const [source, setSource] = useState("");
  const [user, setUser] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    api.symbols().then(setSymbols);
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      const data = await api.adminActivity(token!, {
        symbol,
        side,
        source,
        user,
        date_from: dateFrom,
        date_to: dateTo,
        offset,
        limit: PAGE_SIZE,
      });
      if (!cancelled) setTrades(data);
    }

    load();
    const id = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token, symbol, side, source, user, dateFrom, dateTo, offset]);

  function clearFilters() {
    setSymbol("");
    setSide("");
    setSource("");
    setUser("");
    setDateFrom("");
    setDateTo("");
    setOffset(0);
  }

  return (
    <div>
      <div>
        <h1 className="text-xl font-semibold">Activity Log</h1>
        <p className="mt-1 text-sm text-muted">
          Every trade placed on the platform, across all users, most recent first.
        </p>
      </div>

      <div className="mt-4">
        <FilterBar
          search={{ value: user, onChange: (v) => { setUser(v); setOffset(0); }, placeholder: "Search by user email..." }}
          selects={[
            { key: "symbol", label: "Symbol", value: symbol, onChange: (v) => { setSymbol(v); setOffset(0); }, options: symbols.map((s) => ({ value: s.symbol, label: s.symbol })) },
            { key: "side", label: "Side", value: side, onChange: (v) => { setSide(v); setOffset(0); }, options: [{ value: "BUY", label: "Buy" }, { value: "SELL", label: "Sell" }] },
            { key: "source", label: "Source", value: source, onChange: (v) => { setSource(v); setOffset(0); }, options: [{ value: "manual", label: "Manual" }, { value: "ai_auto", label: "AI (autonomous)" }, { value: "assisted", label: "AI (assisted)" }] },
          ]}
          dateRange={{
            from: dateFrom,
            to: dateTo,
            onFromChange: (v) => { setDateFrom(v); setOffset(0); },
            onToChange: (v) => { setDateTo(v); setOffset(0); },
          }}
          onClear={clearFilters}
        />
      </div>

      <div className="glass mt-4 overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Symbol</th>
              <th className="px-5 py-3 font-medium">Side</th>
              <th className="px-5 py-3 font-medium">Qty</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Confidence</th>
              <th className="px-5 py-3 font-medium">Realized P&amp;L</th>
              <th className="px-5 py-3 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-5 py-3 text-muted">
                  {new Date(t.executed_at).toLocaleString()}
                </td>
                <td className="px-5 py-3">{t.user_email}</td>
                <td className="px-5 py-3 font-medium">{t.symbol}</td>
                <td className={t.side === "BUY" ? "px-5 py-3 text-success" : "px-5 py-3 text-danger"}>
                  {t.side}
                </td>
                <td className="px-5 py-3">{t.quantity.toFixed(4)}</td>
                <td className="px-5 py-3">${t.price.toFixed(2)}</td>
                <td className="px-5 py-3">{t.confidence?.toFixed(0) ?? "—"}%</td>
                <td className="px-5 py-3">
                  {t.realized_pnl != null ? (
                    <span className={t.realized_pnl >= 0 ? "text-success" : "text-danger"}>
                      {t.realized_pnl >= 0 ? "+" : ""}${t.realized_pnl.toFixed(2)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-5 py-3 text-muted">
                  {t.source === "ai_auto" ? "AI (auto)" : t.source === "assisted" ? "AI (assisted)" : "Manual"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {trades.length === 0 && (
          <p className="p-5 text-sm text-muted">No trades match these filters.</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <button
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          disabled={offset === 0}
          className="rounded-lg border border-border px-3 py-2 hover:bg-surface disabled:opacity-30 transition-colors"
        >
          Previous
        </button>
        <span>Showing from #{offset + 1}</span>
        <button
          onClick={() => setOffset(offset + PAGE_SIZE)}
          disabled={trades.length < PAGE_SIZE}
          className="rounded-lg border border-border px-3 py-2 hover:bg-surface disabled:opacity-30 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
