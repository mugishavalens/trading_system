import clsx from "clsx";
import { SymbolInfo } from "@/lib/api";

export default function SymbolTabs({
  symbols,
  selected,
  onSelect,
}: {
  symbols: SymbolInfo[];
  selected: string;
  onSelect: (symbol: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {symbols.map((s) => (
        <button
          key={s.symbol}
          onClick={() => onSelect(s.symbol)}
          className={clsx(
            "rounded-lg border px-4 py-2 text-left transition-colors",
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
      ))}
    </div>
  );
}
