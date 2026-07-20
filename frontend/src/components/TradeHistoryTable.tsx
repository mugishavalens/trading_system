"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Trade } from "@/lib/api";

const SOURCE_LABEL: Record<string, string> = {
  manual: "Manual",
  ai_auto: "AI Auto",
  assisted: "Assisted",
  sl_tp_auto: "Stop-Loss/TP",
  limit_order: "Limit Order",
  stop_order: "Stop Order",
};

export default function TradeHistoryTable({ trades }: { trades: Trade[] }) {
  const [search, setSearch] = useState("");
  const [side, setSide] = useState<"all" | "BUY" | "SELL">("all");
  const [source, setSource] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const sources = useMemo(
    () => Array.from(new Set(trades.map((t) => t.source))),
    [trades]
  );

  const filtered = trades.filter((t) => {
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    if (side !== "all" && t.side !== side) return false;
    if (source !== "all" && t.source !== source) return false;
    const executedDate = t.executed_at.slice(0, 10);
    if (dateFrom && executedDate < dateFrom) return false;
    if (dateTo && executedDate > dateTo) return false;
    return true;
  });

  const hasActiveFilters = search || side !== "all" || source !== "all" || dateFrom || dateTo;

  function clearFilters() {
    setSearch("");
    setSide("all");
    setSource("all");
    setDateFrom("");
    setDateTo("");
  }

  if (trades.length === 0) {
    return <p className="p-4 text-sm text-muted">No trades yet.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Symbol..."
            className="w-32 rounded-lg border border-border bg-surface py-1.5 pl-7 pr-2 text-xs outline-none focus:border-accent"
          />
        </div>
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as "all" | "BUY" | "SELL")}
          className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-accent"
        >
          <option value="all">All sides</option>
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-accent"
        >
          <option value="all">All sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>{SOURCE_LABEL[s] ?? s}</option>
          ))}
        </select>
        <input
          type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          title="From date"
          className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-accent"
        />
        <input
          type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          title="To date"
          className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-accent"
        />
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted hover:text-danger transition-colors"
          >
            <X size={11} /> Clear
          </button>
        )}
        <span className="ml-auto text-xs text-muted">{filtered.length} of {trades.length}</span>
      </div>

      {filtered.length === 0 ? (
        <p className="p-4 text-sm text-muted">No trades match these filters.</p>
      ) : (
        <div className="max-h-80 overflow-y-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr className="text-left text-xs text-muted">
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Asset</th>
                <th className="px-4 py-2 font-medium">Side</th>
                <th className="px-4 py-2 font-medium">Qty</th>
                <th className="px-4 py-2 font-medium">Price</th>
                <th className="px-4 py-2 font-medium">Realized P&amp;L</th>
                <th className="px-4 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted">
                    {new Date(t.executed_at).toLocaleString(undefined, {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium">{t.symbol}</td>
                  <td
                    className={`px-4 py-3 ${
                      t.side === "BUY" ? "text-success" : "text-danger"
                    }`}
                  >
                    {t.side}
                  </td>
                  <td className="px-4 py-3">{t.quantity.toFixed(4)}</td>
                  <td className="px-4 py-3">${t.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {t.realized_pnl != null ? (
                      <span className={t.realized_pnl >= 0 ? "text-success" : "text-danger"}>
                        {t.realized_pnl >= 0 ? "+" : ""}${t.realized_pnl.toFixed(2)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{SOURCE_LABEL[t.source] ?? t.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
