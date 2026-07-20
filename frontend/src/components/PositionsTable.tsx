"use client";

import { useState } from "react";
import clsx from "clsx";
import { Search } from "lucide-react";
import { Position } from "@/lib/api";

type PnlFilter = "all" | "winning" | "losing";

export default function PositionsTable({ positions }: { positions: Position[] }) {
  const [search, setSearch] = useState("");
  const [pnlFilter, setPnlFilter] = useState<PnlFilter>("all");

  if (positions.length === 0) {
    return (
      <p className="p-4 text-sm text-muted">
        No open positions yet — execute a trade to get started.
      </p>
    );
  }

  const filtered = positions.filter((p) => {
    if (search && !p.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    if (pnlFilter === "winning" && p.unrealized_pnl < 0) return false;
    if (pnlFilter === "losing" && p.unrealized_pnl >= 0) return false;
    return true;
  });

  return (
    <div>
      {positions.length > 1 && (
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
          <div className="flex rounded-lg border border-border bg-surface p-0.5 text-xs">
            {(["all", "winning", "losing"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setPnlFilter(f)}
                className={clsx(
                  "rounded-md px-2 py-1 capitalize transition-colors",
                  pnlFilter === f ? "bg-accent text-black" : "text-muted hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-muted">{filtered.length} of {positions.length}</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="p-4 text-sm text-muted">No positions match these filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="px-4 py-2 font-medium">Asset</th>
                <th className="px-4 py-2 font-medium">Qty</th>
                <th className="px-4 py-2 font-medium">Entry</th>
                <th className="px-4 py-2 font-medium">Current</th>
                <th className="px-4 py-2 font-medium">SL / TP</th>
                <th className="px-4 py-2 font-medium">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.symbol} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{p.symbol}</td>
                  <td className="px-4 py-3">{p.quantity.toFixed(4)}</td>
                  <td className="px-4 py-3">${p.avg_entry_price.toFixed(2)}</td>
                  <td className="px-4 py-3">${p.current_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="text-danger">{p.stop_loss ? `SL ${p.stop_loss.toFixed(2)}` : "—"}</span>
                    {" / "}
                    <span className="text-success">{p.take_profit ? `TP ${p.take_profit.toFixed(2)}` : "—"}</span>
                  </td>
                  <td
                    className={`px-4 py-3 ${
                      p.unrealized_pnl >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {p.unrealized_pnl >= 0 ? "+" : ""}
                    ${p.unrealized_pnl.toFixed(2)} ({p.unrealized_pnl_pct.toFixed(2)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
