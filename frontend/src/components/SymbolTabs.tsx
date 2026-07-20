"use client";

import { useState } from "react";
import clsx from "clsx";
import { Star } from "lucide-react";
import { SymbolInfo } from "@/lib/api";
import { ASSET_CLASS_GROUPS } from "@/lib/assetClasses";
import { useWatchlist } from "@/lib/useWatchlist";

const FILTERS = [{ key: "all", label: "All", accent: "#94a3b8" }, ...ASSET_CLASS_GROUPS];

export default function SymbolTabs({
  symbols,
  selected,
  onSelect,
}: {
  symbols: SymbolInfo[];
  selected: string;
  onSelect: (symbol: string) => void;
}) {
  const [filter, setFilter] = useState<string>("all");
  const { watchlist, toggleWatchlist } = useWatchlist();

  const visible = symbols.filter((s) => {
    if (filter === "all") return true;
    if (filter === "watchlist") return watchlist.has(s.symbol);
    return s.asset_class === filter;
  });

  return (
    <div className="space-y-2">
      {/* Asset-class filter, TradingView-style: pick a class, then the symbol
          list (and the chart you click into) narrows to it. */}
      <div className="flex flex-wrap items-center gap-1.5">
        {watchlist.size > 0 && (
          <button
            onClick={() => setFilter("watchlist")}
            className={clsx(
              "flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              filter === "watchlist"
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-surface text-muted hover:text-foreground"
            )}
          >
            <Star size={11} className={filter === "watchlist" ? "fill-current" : ""} />
            Watchlist
          </button>
        )}
        {FILTERS.map(({ key, label, accent }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              filter === key
                ? "border-transparent text-black"
                : "border-border bg-surface text-muted hover:text-foreground"
            )}
            style={filter === key ? { backgroundColor: accent } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {visible.map((s) => (
          <div key={s.symbol} className="relative">
            <button
              onClick={() => onSelect(s.symbol)}
              className={clsx(
                "rounded-lg border py-2 pl-4 pr-7 text-left transition-colors",
                selected === s.symbol
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:border-muted"
              )}
            >
              <p className="text-sm font-semibold">{s.symbol}</p>
              <p className="text-xs text-muted">
                ${s.last_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                <span className={s.change_pct_24h >= 0 ? "text-success" : "text-danger"}>
                  {s.change_pct_24h >= 0 ? "+" : ""}
                  {s.change_pct_24h.toFixed(2)}%
                </span>
              </p>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); toggleWatchlist(s.symbol); }}
              title={watchlist.has(s.symbol) ? "Remove from watchlist" : "Add to watchlist"}
              className={clsx(
                "absolute right-1.5 top-1.5 rounded p-0.5 transition-colors",
                watchlist.has(s.symbol) ? "text-accent" : "text-muted/40 hover:text-muted"
              )}
            >
              <Star size={12} className={watchlist.has(s.symbol) ? "fill-current" : ""} />
            </button>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="py-2 text-sm text-muted">
            {filter === "watchlist" ? "Nothing on your watchlist yet — click the star on any symbol." : "No symbols in this class."}
          </p>
        )}
      </div>
    </div>
  );
}
