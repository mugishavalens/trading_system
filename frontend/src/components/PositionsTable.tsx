"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { ApiError, Position } from "@/lib/api";

type PnlFilter = "all" | "winning" | "losing";

function PositionRow({
  position,
  onClose,
  onUpdateSlTp,
}: {
  position: Position;
  onClose: (symbol: string, quantity: number) => Promise<void>;
  onUpdateSlTp: (symbol: string, stopLoss: number | null, takeProfit: number | null) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [stopLoss, setStopLoss] = useState(position.stop_loss?.toString() ?? "");
  const [takeProfit, setTakeProfit] = useState(position.take_profit?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reflect changes made elsewhere (e.g. reopening the panel after a poll refresh).
  useEffect(() => {
    setStopLoss(position.stop_loss?.toString() ?? "");
    setTakeProfit(position.take_profit?.toString() ?? "");
  }, [position.stop_loss, position.take_profit]);

  async function handleSaveSlTp() {
    setBusy(true);
    setError(null);
    try {
      await onUpdateSlTp(
        position.symbol,
        stopLoss ? parseFloat(stopLoss) : null,
        takeProfit ? parseFloat(takeProfit) : null
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update.");
    } finally {
      setBusy(false);
    }
  }

  async function handleClose(fraction: number) {
    setBusy(true);
    setError(null);
    try {
      const qty = fraction >= 1 ? position.quantity : position.quantity * fraction;
      await onClose(position.symbol, qty);
      if (fraction >= 1) setExpanded(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to close.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <tr className="border-t border-border">
        <td className="px-4 py-3 font-medium">{position.symbol}</td>
        <td className="px-4 py-3">{position.quantity.toFixed(4)}</td>
        <td className="px-4 py-3">${position.avg_entry_price.toFixed(2)}</td>
        <td className="px-4 py-3">${position.current_price.toFixed(2)}</td>
        <td className="px-4 py-3 text-xs">
          <span className="text-danger">{position.stop_loss ? `SL ${position.stop_loss.toFixed(2)}` : "—"}</span>
          {" / "}
          <span className="text-success">{position.take_profit ? `TP ${position.take_profit.toFixed(2)}` : "—"}</span>
        </td>
        <td
          className={`px-4 py-3 ${
            position.unrealized_pnl >= 0 ? "text-success" : "text-danger"
          }`}
        >
          {position.unrealized_pnl >= 0 ? "+" : ""}
          ${position.unrealized_pnl.toFixed(2)} ({position.unrealized_pnl_pct.toFixed(2)}%)
        </td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            Manage {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-t border-border bg-surface-2">
          <td colSpan={7} className="px-4 py-3">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="text-xs text-muted">Stop Loss</label>
                <input
                  type="number" min="0" step="0.0001" value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  placeholder="not set"
                  className="mt-1 w-28 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-danger"
                />
              </div>
              <div>
                <label className="text-xs text-muted">Take Profit</label>
                <input
                  type="number" min="0" step="0.0001" value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  placeholder="not set"
                  className="mt-1 w-28 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-success"
                />
              </div>
              <button
                onClick={handleSaveSlTp}
                disabled={busy}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-black hover:bg-accent-2 disabled:opacity-50 transition-colors"
              >
                Save SL/TP
              </button>

              <div className="h-8 w-px bg-border" />

              <div>
                <label className="text-xs text-muted">Close position</label>
                <div className="mt-1 flex gap-1.5">
                  <button
                    onClick={() => handleClose(0.25)}
                    disabled={busy}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-surface disabled:opacity-50 transition-colors"
                  >
                    25%
                  </button>
                  <button
                    onClick={() => handleClose(0.5)}
                    disabled={busy}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-surface disabled:opacity-50 transition-colors"
                  >
                    50%
                  </button>
                  <button
                    onClick={() => handleClose(1)}
                    disabled={busy}
                    className="rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger/20 disabled:opacity-50 transition-colors"
                  >
                    Close All
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-danger">{error}</p>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function PositionsTable({
  positions,
  onClose,
  onUpdateSlTp,
}: {
  positions: Position[];
  onClose: (symbol: string, quantity: number) => Promise<void>;
  onUpdateSlTp: (symbol: string, stopLoss: number | null, takeProfit: number | null) => Promise<void>;
}) {
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
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <PositionRow
                  key={p.symbol}
                  position={p}
                  onClose={onClose}
                  onUpdateSlTp={onUpdateSlTp}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
