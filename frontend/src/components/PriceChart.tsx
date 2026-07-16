"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  ColorType,
  UTCTimestamp,
  IChartApi,
  ISeriesApi,
  LineStyle,
} from "lightweight-charts";
import { Candle } from "@/lib/api";
import { chartColors } from "@/lib/chartTheme";
import { useTheme } from "@/lib/theme-context";
import {
  MousePointer,
  Minus,
  TrendingUp,
  Layers,
  GitBranch,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Timeframe = "M1" | "M5" | "M15" | "H1" | "H4" | "D1";
type DrawTool = "none" | "hline" | "trendline" | "channel" | "fibonacci";

interface DrawnObject {
  id: string;
  type: DrawTool;
  label: string;
  color: string;
  /** hline */
  price?: number;
  /** trendline / channel top */
  p1?: { time: UTCTimestamp; price: number };
  p2?: { time: UTCTimestamp; price: number };
  /** channel bottom (mirrors p1→p2 shifted by channelGap) */
  p3?: { time: UTCTimestamp; price: number };
  p4?: { time: UTCTimestamp; price: number };
  /** fibonacci: stores [p1, p2] swing; rendered as 6 hlines */
  fibLevels?: number[];
  series: ISeriesApi<"Line">[];
}

const TIMEFRAMES: { label: string; key: Timeframe; minutes: number }[] = [
  { label: "M1",  key: "M1",  minutes: 1    },
  { label: "M5",  key: "M5",  minutes: 5    },
  { label: "M15", key: "M15", minutes: 15   },
  { label: "H1",  key: "H1",  minutes: 60   },
  { label: "H4",  key: "H4",  minutes: 240  },
  { label: "D1",  key: "D1",  minutes: 1440 },
];

/* Fibonacci standard levels */
const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_COLORS = ["#94a3b8", "#f59e0b", "#22c55e", "#38bdf8", "#a78bfa", "#f472b6", "#94a3b8"];
const FIB_LABELS = ["0%", "23.6%", "38.2%", "50%", "61.8%", "78.6%", "100%"];

/* Drawing tool palette */
const DRAW_TOOLS: {
  key: DrawTool;
  label: string;
  icon: React.ElementType;
  color: string;
  hint: string;
}[] = [
  { key: "none",      label: "Select",      icon: MousePointer, color: "",         hint: "" },
  { key: "hline",     label: "H. Line",     icon: Minus,        color: "#f59e0b",  hint: "Click to place support / resistance line" },
  { key: "trendline", label: "Trendline",   icon: TrendingUp,   color: "#22c55e",  hint: "Click two points to draw a trendline" },
  { key: "channel",   label: "Channel",     icon: Layers,       color: "#38bdf8",  hint: "Click two points — sets channel direction; drag height to set width" },
  { key: "fibonacci", label: "Fibonacci",   icon: GitBranch,    color: "#a78bfa",  hint: "Click swing high then swing low (or low→high)" },
];

/* ─── Candle aggregation ─────────────────────────────────────────────────── */
function aggregateCandles(candles: Candle[], minutes: number): Candle[] {
  if (minutes <= 1) return candles;
  const out: Candle[] = [];
  let bucket: Candle | null = null;

  for (const c of candles) {
    const slot = Math.floor(new Date(c.time).getTime() / (minutes * 60_000)) * (minutes * 60_000);
    const slotIso = new Date(slot).toISOString();
    if (!bucket || bucket.time !== slotIso) {
      if (bucket) out.push(bucket);
      bucket = { ...c, time: slotIso };
    } else {
      bucket.high   = Math.max(bucket.high, c.high);
      bucket.low    = Math.min(bucket.low,  c.low);
      bucket.close  = c.close;
      bucket.volume += c.volume;
    }
  }
  if (bucket) out.push(bucket);
  return out;
}

/* ─── Helper: add a styled line series ──────────────────────────────────── */
function addLineSeries(
  chart: IChartApi,
  opts: {
    color: string;
    width?: number;
    style?: LineStyle;
    title?: string;
    lastVisible?: boolean;
  }
): ISeriesApi<"Line"> {
  return chart.addSeries(LineSeries, {
    color:                  opts.color,
    lineWidth:              (opts.width ?? 1) as 1 | 2 | 3 | 4,
    lineStyle:              opts.style ?? LineStyle.Dashed,
    priceLineVisible:       false,
    lastValueVisible:       opts.lastVisible ?? false,
    crosshairMarkerVisible: false,
    title:                  opts.title ?? "",
  });
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function PriceChart({
  candles,
  expanded = false,
}: {
  candles: Candle[];
  expanded?: boolean;
}) {
  const containerRef      = useRef<HTMLDivElement>(null);
  const chartRef          = useRef<IChartApi | null>(null);
  const candleSeriesRef   = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const drawnObjectsRef   = useRef<DrawnObject[]>([]);
  const pendingPointRef   = useRef<{ time: UTCTimestamp; price: number } | null>(null);
  const displayCandlesRef = useRef<Candle[]>([]);

  const { theme } = useTheme();
  const [timeframe,       setTimeframe]       = useState<Timeframe>("M1");
  const [drawTool,        setDrawTool]        = useState<DrawTool>("none");
  const [drawnList,       setDrawnList]       = useState<Omit<DrawnObject, "series">[]>([]);
  const [awaitingSecond,  setAwaitingSecond]  = useState(false);
  const [showDrawings,    setShowDrawings]    = useState(false);

  /* ── derived candles ── */
  const tf = TIMEFRAMES.find((t) => t.key === timeframe)!;
  const displayCandles = aggregateCandles(candles, tf.minutes);
  displayCandlesRef.current = displayCandles;

  /* ── sync drawnList state from ref (for rendering) ── */
  function syncList() {
    setDrawnList(
      drawnObjectsRef.current.map(({ series: _s, ...rest }) => rest)
    );
  }

  /* ── Build / rebuild chart ── */
  useEffect(() => {
    if (!containerRef.current) return;
    const colors = chartColors(theme);
    const height  = expanded ? 520 : 300;

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
      crosshair: { mode: 1 },
      width:  containerRef.current.clientWidth,
      height,
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
      displayCandles.map((c) => ({
        time:  (new Date(c.time).getTime() / 1000) as UTCTimestamp,
        open: c.open, high: c.high, low: c.low, close: c.close,
      }))
    );

    chart.timeScale().fitContent();
    chartRef.current      = chart;
    candleSeriesRef.current = series;

    /* Re-attach drawn objects after chart rebuild */
    drawnObjectsRef.current = drawnObjectsRef.current.map((obj) => {
      const dc = displayCandlesRef.current;
      const pts = dc.map((c) => (new Date(c.time).getTime() / 1000) as UTCTimestamp);
      const t0 = pts[0], t1 = pts[pts.length - 1];

      const newSeries: ISeriesApi<"Line">[] = [];

      if (obj.type === "hline" && obj.price !== undefined) {
        const s = addLineSeries(chart, { color: obj.color, width: 2, style: LineStyle.Dashed, lastVisible: true, title: obj.label });
        s.setData(dc.map((c) => ({ time: (new Date(c.time).getTime() / 1000) as UTCTimestamp, value: obj.price! })));
        newSeries.push(s);

      } else if (obj.type === "trendline" && obj.p1 && obj.p2) {
        const s = addLineSeries(chart, { color: obj.color, width: 2, style: LineStyle.Solid, title: "Trend" });
        s.setData([{ time: obj.p1.time, value: obj.p1.price }, { time: obj.p2.time, value: obj.p2.price }]);
        newSeries.push(s);

      } else if (obj.type === "channel" && obj.p1 && obj.p2 && obj.p3 && obj.p4) {
        const s1 = addLineSeries(chart, { color: obj.color, width: 2, style: LineStyle.Solid, title: "Ch+" });
        s1.setData([{ time: obj.p1.time, value: obj.p1.price }, { time: obj.p2.time, value: obj.p2.price }]);
        const s2 = addLineSeries(chart, { color: obj.color, width: 1, style: LineStyle.Dashed, title: "Ch−" });
        s2.setData([{ time: obj.p3.time, value: obj.p3.price }, { time: obj.p4.time, value: obj.p4.price }]);
        newSeries.push(s1, s2);

      } else if (obj.type === "fibonacci" && obj.p1 && obj.p2 && obj.fibLevels) {
        obj.fibLevels.forEach((lvl, i) => {
          const s = addLineSeries(chart, { color: FIB_COLORS[i], width: 1, style: LineStyle.Dashed, title: FIB_LABELS[i], lastVisible: true });
          s.setData([{ time: t0, value: lvl }, { time: t1, value: lvl }]);
          newSeries.push(s);
        });
      }

      return { ...obj, series: newSeries };
    });

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); chart.remove(); chartRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, expanded, timeframe]);

  /* ── Update candle data without full rebuild ── */
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    candleSeriesRef.current.setData(
      displayCandles.map((c) => ({
        time:  (new Date(c.time).getTime() / 1000) as UTCTimestamp,
        open: c.open, high: c.high, low: c.low, close: c.close,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, timeframe]);

  /* ── Chart click handler ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || drawTool === "none") return;

    const colors = chartColors(theme);

    function onContainerClick(e: MouseEvent) {
      const chart  = chartRef.current;
      const series = candleSeriesRef.current;
      if (!chart || !series || !container) return;

      const rect  = container.getBoundingClientRect();
      const x     = e.clientX - rect.left;
      const y     = e.clientY - rect.top;

      const price = series.coordinateToPrice(y);
      if (price === null) return;
      const time = chart.timeScale().coordinateToTime(x) as UTCTimestamp | null;
      if (!time) return;

      const dc = displayCandlesRef.current;
      const pts = dc.map((c) => (new Date(c.time).getTime() / 1000) as UTCTimestamp);
      const t0 = pts[0], t1 = pts[pts.length - 1];

      /* ── Horizontal line (single click) ── */
      if (drawTool === "hline") {
        const s = addLineSeries(chart, { color: colors.accent, width: 2, style: LineStyle.Dashed, lastVisible: true, title: "S/R" });
        s.setData(dc.map((c) => ({ time: (new Date(c.time).getTime() / 1000) as UTCTimestamp, value: price })));
        const obj: DrawnObject = {
          id: crypto.randomUUID(), type: "hline",
          label: `H-Line @ ${price.toFixed(4)}`,
          color: colors.accent,
          price, series: [s],
        };
        drawnObjectsRef.current.push(obj);
        syncList();
        return;
      }

      /* ── Two-point tools ── */
      if (drawTool === "trendline" || drawTool === "channel" || drawTool === "fibonacci") {
        if (!pendingPointRef.current) {
          pendingPointRef.current = { time, price };
          setAwaitingSecond(true);
          return;
        }

        const p1 = pendingPointRef.current;
        const p2 = { time, price };
        pendingPointRef.current = null;
        setAwaitingSecond(false);

        const [a, b] = p1.time <= p2.time ? [p1, p2] : [p2, p1];

        /* ── Trendline ── */
        if (drawTool === "trendline") {
          const s = addLineSeries(chart, { color: colors.success, width: 2, style: LineStyle.Solid, title: "Trend" });
          s.setData([{ time: a.time, value: a.price }, { time: b.time, value: b.price }]);
          const obj: DrawnObject = {
            id: crypto.randomUUID(), type: "trendline",
            label: `Trendline`,
            color: colors.success,
            p1: a, p2: b, series: [s],
          };
          drawnObjectsRef.current.push(obj);
          syncList();
        }

        /* ── Channel (two parallel lines — offset by a fraction of swing) ── */
        if (drawTool === "channel") {
          const gap = Math.abs(a.price - b.price) * 0.4; // channel width = 40% of trendline height
          const s1 = addLineSeries(chart, { color: "#38bdf8", width: 2, style: LineStyle.Solid, title: "Ch+" });
          s1.setData([{ time: a.time, value: a.price }, { time: b.time, value: b.price }]);
          const s2 = addLineSeries(chart, { color: "#38bdf8", width: 1, style: LineStyle.Dashed, title: "Ch−" });
          s2.setData([{ time: a.time, value: a.price - gap }, { time: b.time, value: b.price - gap }]);
          const obj: DrawnObject = {
            id: crypto.randomUUID(), type: "channel",
            label: `Channel`,
            color: "#38bdf8",
            p1: a, p2: b,
            p3: { time: a.time, price: a.price - gap },
            p4: { time: b.time, price: b.price - gap },
            series: [s1, s2],
          };
          drawnObjectsRef.current.push(obj);
          syncList();
        }

        /* ── Fibonacci retracement ── */
        if (drawTool === "fibonacci") {
          const high = Math.max(a.price, b.price);
          const low  = Math.min(a.price, b.price);
          const swing = high - low;
          const levels = FIB_LEVELS.map((f) => high - f * swing);
          const fibSeries: ISeriesApi<"Line">[] = [];
          levels.forEach((lvl, i) => {
            const s = addLineSeries(chart, { color: FIB_COLORS[i], width: 1, style: LineStyle.Dashed, title: FIB_LABELS[i], lastVisible: true });
            s.setData([{ time: t0, value: lvl }, { time: t1, value: lvl }]);
            fibSeries.push(s);
          });
          const obj: DrawnObject = {
            id: crypto.randomUUID(), type: "fibonacci",
            label: `Fibonacci`,
            color: "#a78bfa",
            p1: a, p2: b,
            fibLevels: levels,
            series: fibSeries,
          };
          drawnObjectsRef.current.push(obj);
          syncList();
        }
      }
    }

    container.addEventListener("click", onContainerClick);
    return () => container.removeEventListener("click", onContainerClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawTool, theme, timeframe, expanded]);

  /* ── Delete a single drawn object ── */
  const deleteObject = useCallback((id: string) => {
    const chart = chartRef.current;
    const idx   = drawnObjectsRef.current.findIndex((o) => o.id === id);
    if (idx === -1) return;
    const obj = drawnObjectsRef.current[idx];
    obj.series.forEach((s) => { try { chart?.removeSeries(s); } catch { /* gone */ } });
    drawnObjectsRef.current.splice(idx, 1);
    syncList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Clear all drawings ── */
  const clearAll = useCallback(() => {
    const chart = chartRef.current;
    drawnObjectsRef.current.forEach((obj) => {
      obj.series.forEach((s) => { try { chart?.removeSeries(s); } catch { /* gone */ } });
    });
    drawnObjectsRef.current = [];
    pendingPointRef.current = null;
    setAwaitingSecond(false);
    syncList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Switch tool ── */
  function selectTool(t: DrawTool) {
    pendingPointRef.current = null;
    setAwaitingSecond(false);
    setDrawTool(t);
  }

  const cursorStyle = drawTool !== "none" ? "crosshair" : "default";
  const toolInfo    = DRAW_TOOLS.find((t) => t.key === drawTool)!;

  return (
    <div className="space-y-2">

      {/* ══════════════ TOOLBAR ══════════════ */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Timeframes */}
        <div className="flex items-center gap-0.5 rounded-xl border border-border bg-surface p-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTimeframe(t.key); selectTool("none"); }}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                timeframe === t.key
                  ? "bg-accent text-black shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Drawing tools */}
        <div className="flex items-center gap-0.5 rounded-xl border border-border bg-surface p-1">
          {DRAW_TOOLS.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => selectTool(key)}
              title={label}
              className={`flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-all ${
                drawTool === key
                  ? key === "none"
                    ? "bg-surface-2 text-foreground border border-border"
                    : "text-black shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
              style={drawTool === key && key !== "none" ? { backgroundColor: color } : {}}
            >
              <Icon size={12} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Drawings list toggle */}
        {drawnList.length > 0 && (
          <>
            <div className="h-6 w-px bg-border" />
            <button
              onClick={() => setShowDrawings((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
            >
              {showDrawings ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              Drawings ({drawnList.length})
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/20 transition-colors"
            >
              <Trash2 size={11} /> Clear all
            </button>
          </>
        )}

        {/* Drawing hint */}
        {drawTool !== "none" && (
          <span className="text-xs text-accent animate-pulse">
            {awaitingSecond ? "Click second point to complete" : toolInfo.hint}
          </span>
        )}
      </div>

      {/* ══════════════ DRAWINGS PANEL ══════════════ */}
      {showDrawings && drawnList.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted">
            Drawn Objects
          </div>
          <div className="divide-y divide-border">
            {drawnList.map((obj) => {
              const toolDef = DRAW_TOOLS.find((t) => t.key === obj.type);
              const Icon = toolDef?.icon ?? Minus;
              return (
                <div key={obj.id} className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-2 transition-colors group">
                  {/* color swatch */}
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: obj.color }}
                  />
                  <Icon size={11} className="shrink-0 text-muted" />
                  <span className="flex-1 truncate text-foreground/80">{obj.label}</span>
                  {obj.type === "hline" && obj.price !== undefined && (
                    <span className="font-mono tabular-nums text-muted shrink-0">
                      {obj.price.toFixed(5)}
                    </span>
                  )}
                  {/* Individual delete */}
                  <button
                    onClick={() => deleteObject(obj.id)}
                    className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/20 text-danger"
                    title="Remove this line"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════ CHART CANVAS ══════════════ */}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden"
        style={{ cursor: cursorStyle }}
      />
    </div>
  );
}
