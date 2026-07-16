"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import clsx from "clsx";
import { ChevronDown, TrendingUp, TrendingDown, Minus, Search, X } from "lucide-react";
import {
  createChart, CandlestickSeries, LineSeries,
  ColorType, UTCTimestamp, LineStyle,
} from "lightweight-charts";
import { api, AIRecommendation, Candle, SymbolInfo } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { chartColors } from "@/lib/chartTheme";
import { useTheme } from "@/lib/theme-context";

/* ─── Asset class groups ────────────────────────────────────────────────── */
const GROUPS = [
  { key: "crypto",    label: "Crypto",      accent: "#f59e0b" },
  { key: "forex",     label: "Forex",       accent: "#38bdf8" },
  { key: "stock",     label: "Stocks",      accent: "#22c55e" },
  { key: "index",     label: "Indices",     accent: "#a78bfa" },
  { key: "commodity", label: "Commodities", accent: "#fb923c" },
];

/* Short badge labels for well-known tickers */
const BADGE_LABELS: Record<string, string> = {
  "BTC/USD": "BTC", "ETH/USD": "ETH", "SOL/USD": "SOL", "XRP/USD": "XRP",
  "BNB/USD": "BNB", "ADA/USD": "ADA",
  "EUR/USD": "EUR", "GBP/USD": "GBP", "USD/JPY": "JPY", "AUD/USD": "AUD",
  "USD/CAD": "CAD", "NZD/USD": "NZD", "USD/CHF": "CHF",
  "AAPL": "AAPL", "TSLA": "TSLA", "GOOGL": "GOOG", "MSFT": "MSFT",
  "AMZN": "AMZN", "NVDA": "NVDA", "META": "META",
  "GOLD": "XAU", "SILVER": "XAG", "USOIL": "OIL", "NATGAS": "GAS",
  "SPX500": "SPX", "DJIA": "DJI", "NAS100": "NDX", "RUT2000": "RUT",
  "NYSE": "NYA", "DAX40": "DAX",
};

/* Per-asset-class badge accent colors */
const CLASS_ACCENT: Record<string, string> = {
  crypto:    "#f59e0b",
  forex:     "#38bdf8",
  stock:     "#22c55e",
  index:     "#a78bfa",
  commodity: "#fb923c",
};

const SENTIMENT: Record<string, { icon: typeof TrendingUp; cls: string }> = {
  BUY:  { icon: TrendingUp,   cls: "text-success" },
  SELL: { icon: TrendingDown, cls: "text-danger" },
  HOLD: { icon: Minus,        cls: "text-muted" },
};

/* ─── Period selector ────────────────────────────────────────────────────── */
const PERIODS = [
  { label: "1D",  candles: 60,   minutes: 1   },
  { label: "5D",  candles: 300,  minutes: 5   },
  { label: "1M",  candles: 180,  minutes: 15  },
  { label: "6M",  candles: 180,  minutes: 60  },
  { label: "1Y",  candles: 365,  minutes: 240 },
];

/* ─── Candle aggregation ─────────────────────────────────────────────────── */
function aggregate(candles: Candle[], minutes: number): Candle[] {
  if (minutes <= 1) return candles;
  const out: Candle[] = [];
  let cur: Candle | null = null;
  for (const c of candles) {
    const slot = Math.floor(new Date(c.time).getTime() / (minutes * 60_000)) * (minutes * 60_000);
    const slotIso = new Date(slot).toISOString();
    if (!cur || cur.time !== slotIso) {
      if (cur) out.push(cur);
      cur = { ...c, time: slotIso };
    } else {
      cur.high   = Math.max(cur.high, c.high);
      cur.low    = Math.min(cur.low,  c.low);
      cur.close  = c.close;
      cur.volume += c.volume;
    }
  }
  if (cur) out.push(cur);
  return out;
}

/* ─── Inline chart ────────────────────────────────────────────────────────── */
function InlineChart({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme }    = useTheme();
  const { token }    = useAuth();

  const [allCandles, setAllCandles]   = useState<Candle[]>([]);
  const [periodIdx,  setPeriodIdx]    = useState(0);
  const [rec,        setRec]          = useState<AIRecommendation | null>(null);

  /* fetch candles + recommendation */
  useEffect(() => {
    api.candles(symbol, 500).then(setAllCandles);
    if (token) api.recommendation(token, symbol).then(setRec).catch(() => {});
  }, [symbol, token]);

  /* build chart */
  useEffect(() => {
    if (!containerRef.current || allCandles.length === 0) return;

    const period  = PERIODS[periodIdx];
    const display = aggregate(allCandles, period.minutes);
    const colors  = chartColors(theme);

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor:  colors.textColor,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      width:  containerRef.current.clientWidth,
      height: 320,
      timeScale: { timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: colors.gridColor },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor:       colors.success,
      downColor:     colors.danger,
      borderVisible: false,
      wickUpColor:   colors.success,
      wickDownColor: colors.danger,
    });

    series.setData(
      display.map((c) => ({
        time:  (new Date(c.time).getTime() / 1000) as UTCTimestamp,
        open: c.open, high: c.high, low: c.low, close: c.close,
      }))
    );

    /* AI SL/TP lines if recommendation available */
    if (rec && rec.indicators) {
      const price = rec.price;
      const atr   = rec.indicators.atr ?? price * 0.015;
      const sl    = rec.action === "BUY"  ? price - 1.5 * atr : price + 1.5 * atr;
      const tp    = rec.action === "BUY"  ? price + 2.5 * atr : price - 2.5 * atr;
      const times = display.map((c) => (new Date(c.time).getTime() / 1000) as UTCTimestamp);
      const t0 = times[0], t1 = times[times.length - 1];

      if (rec.action !== "HOLD") {
        const slSeries = chart.addSeries(LineSeries, {
          color: colors.danger, lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false, lastValueVisible: true, title: "SL",
        });
        slSeries.setData([{ time: t0, value: sl }, { time: t1, value: sl }]);

        const tpSeries = chart.addSeries(LineSeries, {
          color: colors.success, lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false, lastValueVisible: true, title: "TP",
        });
        tpSeries.setData([{ time: t0, value: tp }, { time: t1, value: tp }]);
      }
    }

    chart.timeScale().fitContent();

    const onResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.remove(); };
  }, [allCandles, periodIdx, theme, rec]);

  /* period performance */
  const perf = PERIODS.map((p) => {
    const d = aggregate(allCandles, p.minutes);
    if (d.length < 2) return { label: p.label, pct: 0 };
    const pct = ((d[d.length - 1].close - d[0].open) / d[0].open) * 100;
    return { label: p.label, pct };
  });

  return (
    <div className="border-t border-border bg-background/50 px-4 pb-4 pt-3">
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{symbol}</span>
          {rec && (
            <span className={clsx(
              "rounded-full border px-2 py-0.5 text-xs font-semibold",
              rec.action === "BUY"  && "border-success/30 bg-success/10 text-success",
              rec.action === "SELL" && "border-danger/30 bg-danger/10 text-danger",
              rec.action === "HOLD" && "border-border bg-surface-2 text-muted",
            )}>
              {rec.action} · {rec.confidence.toFixed(0)}%
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* chart */}
      <div ref={containerRef} className="w-full rounded-xl overflow-hidden" />

      {/* period buttons + performance */}
      <div className="mt-3 flex gap-2 flex-wrap">
        {perf.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setPeriodIdx(i)}
            className={clsx(
              "flex flex-col items-center rounded-xl px-3 py-2 text-xs transition-all min-w-[56px]",
              i === periodIdx
                ? "bg-surface-2 border border-border"
                : "text-muted hover:text-foreground"
            )}
          >
            <span className="font-semibold">{p.label}</span>
            <span className={p.pct >= 0 ? "text-success" : "text-danger"}>
              {p.pct >= 0 ? "+" : ""}{p.pct.toFixed(2)}%
            </span>
          </button>
        ))}
      </div>

      {/* AI SL/TP hint */}
      {rec && rec.action !== "HOLD" && rec.indicators && (
        <div className="mt-3 flex gap-3 text-xs text-muted">
          <span className="text-danger font-medium">
            SL: ${(rec.action === "BUY"
              ? rec.price - 1.5 * rec.indicators.atr
              : rec.price + 1.5 * rec.indicators.atr
            ).toLocaleString(undefined, { maximumFractionDigits: 5 })}
          </span>
          <span className="text-success font-medium">
            TP: ${(rec.action === "BUY"
              ? rec.price + 2.5 * rec.indicators.atr
              : rec.price - 2.5 * rec.indicators.atr
            ).toLocaleString(undefined, { maximumFractionDigits: 5 })}
          </span>
          <span className="text-muted">· AI-suggested based on ATR</span>
        </div>
      )}
    </div>
  );
}

/* ─── Symbol row ─────────────────────────────────────────────────────────── */
function SymbolRow({
  symbol,
  rec,
  expanded,
  onToggle,
}: {
  symbol: SymbolInfo;
  rec?: AIRecommendation;
  expanded: boolean;
  onToggle: () => void;
}) {
  const positive  = symbol.change_pct_24h >= 0;
  const SentIcon  = rec ? SENTIMENT[rec.action]?.icon : null;
  const sentCls   = rec ? SENTIMENT[rec.action]?.cls  : "";
  const badge     = BADGE_LABELS[symbol.symbol] ?? symbol.symbol.slice(0, 3);
  const badgeColor = CLASS_ACCENT[symbol.asset_class] ?? "#f59e0b";

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors text-sm"
      >
        {/* Symbol badge */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
          style={{ backgroundColor: `${badgeColor}20`, color: badgeColor }}
        >
          {badge}
        </div>

        {/* Symbol name */}
        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold truncate">{symbol.symbol}</p>
          <p className="text-xs text-muted truncate">{symbol.name}</p>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <p className="font-semibold tabular-nums">
            {symbol.last_price < 10
              ? symbol.last_price.toFixed(4)
              : symbol.last_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className={clsx("text-xs tabular-nums font-medium", positive ? "text-success" : "text-danger")}>
            {positive ? "▲" : "▼"} {Math.abs(symbol.change_pct_24h).toFixed(2)}%
          </p>
        </div>

        {/* AI signal */}
        {SentIcon && (
          <SentIcon size={14} className={clsx("shrink-0", sentCls)} />
        )}
      </button>

      {expanded && (
        <InlineChart symbol={symbol.symbol} onClose={onToggle} />
      )}
    </div>
  );
}

/* ─── Group section ──────────────────────────────────────────────────────── */
function GroupSection({
  label,
  accent,
  symbols,
  recs,
  expandedSymbol,
  onToggle,
}: {
  label: string;
  accent: string;
  symbols: SymbolInfo[];
  recs: Record<string, AIRecommendation>;
  expandedSymbol: string | null;
  onToggle: (sym: string) => void;
}) {
  const [open, setOpen] = useState(true);

  if (symbols.length === 0) return null;

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wide text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
      >
        <ChevronDown
          size={12}
          className={clsx("transition-transform duration-200", !open && "-rotate-90")}
          style={{ color: accent }}
        />
        <span style={{ color: accent }} className="font-bold tracking-widest uppercase">
          {label}
        </span>
        <span
          className="ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: `${accent}20`, color: accent }}
        >
          {symbols.length}
        </span>
      </button>

      {open && (
        <div>
          {symbols.map((s) => (
            <SymbolRow
              key={s.symbol}
              symbol={s}
              rec={recs[s.symbol]}
              expanded={expandedSymbol === s.symbol}
              onToggle={() => onToggle(s.symbol)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function MarketsPage() {
  const { token }    = useAuth();
  const [symbols,    setSymbols]    = useState<SymbolInfo[]>([]);
  const [recs,       setRecs]       = useState<Record<string, AIRecommendation>>({});
  const [search,     setSearch]     = useState("");
  const [expanded,   setExpanded]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const list = await api.symbols();
      if (!cancelled) setSymbols(list);
    }
    load();
    const id = setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function loadRecs() {
      const list = await api.recommendations(token!);
      if (!cancelled) setRecs(Object.fromEntries(list.map((r) => [r.symbol, r])));
    }
    loadRecs();
    const id = setInterval(loadRecs, 8000);
    return () => { cancelled = true; clearInterval(id); };
  }, [token]);

  function handleToggle(sym: string) {
    setExpanded((prev) => prev === sym ? null : sym);
  }

  const filtered = symbols.filter(
    (s) =>
      search === "" ||
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Markets</h1>
          <p className="text-sm text-muted">Click any symbol to expand its chart.</p>
        </div>
        <div className="relative w-full sm:w-52">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-3 border-b border-border bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted">
          <div className="w-7 shrink-0" />
          <div className="flex-1">Symbol</div>
          <div className="shrink-0 text-right w-28">Price / Change</div>
          <div className="shrink-0 w-5" />
        </div>

        {GROUPS.map(({ key, label, accent }) => (
          <GroupSection
            key={key}
            label={label}
            accent={accent}
            symbols={filtered.filter((s) => s.asset_class === key)}
            recs={recs}
            expandedSymbol={expanded}
            onToggle={handleToggle}
          />
        ))}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-muted">No symbols match your search.</div>
        )}
      </div>
    </div>
  );
}
