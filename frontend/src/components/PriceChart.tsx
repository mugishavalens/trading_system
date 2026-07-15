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
import { Minus, TrendingUp, MousePointer, Trash2, BarChart2 } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type Timeframe = "M1" | "M5" | "M15" | "H1" | "H4" | "D1";
type DrawTool = "none" | "hline" | "trendline";

interface DrawnLine {
  id: string;
  type: "hline" | "trendline";
  price?: number;           // for hline
  p1?: { time: UTCTimestamp; price: number }; // for trendline
  p2?: { time: UTCTimestamp; price: number };
  series: ISeriesApi<"Line">;
}

const TIMEFRAMES: { label: string; key: Timeframe; minutes: number }[] = [
  { label: "M1",  key: "M1",  minutes: 1   },
  { label: "M5",  key: "M5",  minutes: 5   },
  { label: "M15", key: "M15", minutes: 15  },
  { label: "H1",  key: "H1",  minutes: 60  },
  { label: "H4",  key: "H4",  minutes: 240 },
  { label: "D1",  key: "D1",  minutes: 1440},
];

/* ─── Candle aggregation ─────────────────────────────────────────────────── */
function aggregateCandles(candles: Candle[], minutes: number): Candle[] {
  if (minutes <= 1) return candles;
  const out: Candle[] = [];
  let bucket: Candle[] = [];

  for (const c of candles) {
    const ts = new Date(c.time).getTime();
    const slot = Math.floor(ts / (minutes * 60_000)) * (minutes * 60_000);

    if (bucket.length === 0 || new Date(bucket[0].time).getTime() === slot) {
      if (bucket.length === 0) {
        bucket.push({ ...c, time: new Date(slot).toISOString() });
      } else {
        const last = bucket[0];
        bucket[0] = {
          ...last,
          high:   Math.max(last.high, c.high),
          low:    Math.min(last.low,  c.low),
          close:  c.close,
          volume: last.volume + c.volume,
        };
      }
    } else {
      out.push(bucket[0]);
      bucket = [{ ...c, time: new Date(slot).toISOString() }];
    }
  }
  if (bucket.length > 0) out.push(bucket[0]);
  return out;
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function PriceChart({
  candles,
  expanded = false,
}: {
  candles: Candle[];
  expanded?: boolean;
}) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const chartRef        = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const drawnLinesRef   = useRef<DrawnLine[]>([]);
  const trendlineFirstRef = useRef<{ time: UTCTimestamp; price: number } | null>(null);
  const displayCandlesRef = useRef<Candle[]>([]); // stable ref so click handler always has latest

  const { theme }     = useTheme();
  const [timeframe,   setTimeframe]   = useState<Timeframe>("M1");
  const [drawTool,    setDrawTool]    = useState<DrawTool>("none");
  const [lineCount,        setLineCount]        = useState(0);
  const [trendlineStarted, setTrendlineStarted] = useState(false);

  /* ── derived candles ── */
  const tf = TIMEFRAMES.find((t) => t.key === timeframe)!;
  const displayCandles = aggregateCandles(candles, tf.minutes);
  displayCandlesRef.current = displayCandles; // always in sync

  /* ── build / rebuild chart ── */
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
        open:  c.open,
        high:  c.high,
        low:   c.low,
        close: c.close,
      }))
    );

    chart.timeScale().fitContent();

    chartRef.current      = chart;
    candleSeriesRef.current = series;

    /* Re-draw any existing lines after chart rebuild */
    drawnLinesRef.current = drawnLinesRef.current.map((dl) => {
      const newSeries = chart.addSeries(LineSeries, {
        color:     colors.accent,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });

      if (dl.type === "hline" && dl.price !== undefined) {
        const pts = displayCandles.map((c) => ({
          time:  (new Date(c.time).getTime() / 1000) as UTCTimestamp,
          value: dl.price!,
        }));
        newSeries.setData(pts);
      } else if (dl.type === "trendline" && dl.p1 && dl.p2) {
        newSeries.setData([
          { time: dl.p1.time, value: dl.p1.price },
          { time: dl.p2.time, value: dl.p2.price },
        ]);
      }
      return { ...dl, series: newSeries };
    });

    /* Resize */
    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, expanded, timeframe]);

  /* ── Update candle data without full rebuild ── */
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    candleSeriesRef.current.setData(
      displayCandles.map((c) => ({
        time:  (new Date(c.time).getTime() / 1000) as UTCTimestamp,
        open:  c.open,
        high:  c.high,
        low:   c.low,
        close: c.close,
      }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, timeframe]);

  /* ── Chart click handler for drawing ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (drawTool === "none") return;

    const colors = chartColors(theme);

    function onContainerClick(e: MouseEvent) {
      const chart = chartRef.current;
      const series = candleSeriesRef.current;
      if (!chart || !series || !container) return;

      // Convert DOM pixel coords to chart price/time
      const rect  = container.getBoundingClientRect();
      const x     = e.clientX - rect.left;
      const y     = e.clientY - rect.top;

      const price = series.coordinateToPrice(y);
      if (price === null) return;

      // Convert x pixel to time via the time scale
      const time = chart.timeScale().coordinateToTime(x) as UTCTimestamp | null;
      if (!time) return;

      const dc = displayCandlesRef.current;

      if (drawTool === "hline") {
        const lineSeries = chart.addSeries(LineSeries, {
          color:     colors.accent,
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: true,
          crosshairMarkerVisible: false,
          title: "S/R",
        });
        lineSeries.setData(
          dc.map((c) => ({
            time:  (new Date(c.time).getTime() / 1000) as UTCTimestamp,
            value: price,
          }))
        );
        drawnLinesRef.current.push({ id: crypto.randomUUID(), type: "hline", price, series: lineSeries });
        setLineCount((n) => n + 1);

      } else if (drawTool === "trendline") {
        if (!trendlineFirstRef.current) {
          trendlineFirstRef.current = { time, price };
          setTrendlineStarted(true);
        } else {
          const p1 = trendlineFirstRef.current;
          const p2 = { time, price };
          const lineSeries = chart.addSeries(LineSeries, {
            color:     "#22c55e",
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: true,
            title: "Trend",
          });
          const [a, b] = p1.time < p2.time ? [p1, p2] : [p2, p1];
          lineSeries.setData([
            { time: a.time, value: a.price },
            { time: b.time, value: b.price },
          ]);
          drawnLinesRef.current.push({ id: crypto.randomUUID(), type: "trendline", p1: a, p2: b, series: lineSeries });
          trendlineFirstRef.current = null;
          setTrendlineStarted(false);
          setLineCount((n) => n + 1);
        }
      }
    }

    container.addEventListener("click", onContainerClick);
    return () => container.removeEventListener("click", onContainerClick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawTool, theme, timeframe, expanded]);

  /* ── Clear all drawn objects ── */
  const clearLines = useCallback(() => {
    if (!chartRef.current) return;
    drawnLinesRef.current.forEach((dl) => {
      try { chartRef.current!.removeSeries(dl.series); } catch { /* already gone */ }
    });
    drawnLinesRef.current = [];
    trendlineFirstRef.current = null;
    setLineCount(0);
  }, []);

  /* ── cursor style ── */
  const cursorStyle = drawTool !== "none" ? "crosshair" : "default";

  return (
    <div className="space-y-2">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Timeframe buttons */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTimeframe(t.key); setDrawTool("none"); setTrendlineStarted(false); }}
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

        {/* Separator */}
        <div className="h-6 w-px bg-border" />

        {/* Drawing tools */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          <button
            onClick={() => { setDrawTool("none"); setTrendlineStarted(false); trendlineFirstRef.current = null; }}
            title="Select / Pan"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              drawTool === "none"
                ? "bg-accent text-black"
                : "text-muted hover:text-foreground"
            }`}
          >
            <MousePointer size={13} />
          </button>
          <button
            onClick={() => setDrawTool("hline")}
            title="Horizontal Line (Support / Resistance)"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              drawTool === "hline"
                ? "bg-accent text-black"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Minus size={13} />
          </button>
          <button
            onClick={() => setDrawTool("trendline")}
            title="Trendline (click two points)"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
              drawTool === "trendline"
                ? "bg-success text-black"
                : "text-muted hover:text-foreground"
            }`}
          >
            <TrendingUp size={13} />
          </button>
          <button
            onClick={() => setDrawTool(drawTool === "hline" ? "hline" : "hline")}
            title="Candlestick info (default view)"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-foreground"
          >
            <BarChart2 size={13} />
          </button>
        </div>

        {/* Clear drawings */}
        {lineCount > 0 && (
          <button
            onClick={clearLines}
            className="flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/20 transition-colors"
          >
            <Trash2 size={11} /> Clear ({lineCount})
          </button>
        )}

        {/* Drawing hint */}
        {drawTool !== "none" && (
          <span className="text-xs text-accent animate-pulse">
            {drawTool === "hline"
              ? "Click chart to place horizontal line"
              : trendlineStarted
              ? "Click second point to complete trendline"
              : "Click first point of trendline"}
          </span>
        )}
      </div>

      {/* ── Chart canvas ── */}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden"
        style={{ cursor: cursorStyle }}
      />
    </div>
  );
}
