"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries, ColorType, UTCTimestamp } from "lightweight-charts";
import { EquitySnapshot } from "@/lib/api";
import { chartColors } from "@/lib/chartTheme";
import { useTheme } from "@/lib/theme-context";

export default function EquityChart({ snapshots }: { snapshots: EquitySnapshot[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;
    const colors = chartColors(theme);

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: colors.textColor,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      width: containerRef.current.clientWidth,
      height: 260,
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    const series = chart.addSeries(LineSeries, {
      color: colors.accent,
      lineWidth: 2,
    });

    series.setData(
      snapshots.map((s) => ({
        time: (new Date(s.recorded_at).getTime() / 1000) as UTCTimestamp,
        value: s.equity,
      }))
    );

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [snapshots, theme]);

  if (snapshots.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted">
        Keep this tab open and trade a bit — the equity curve fills in as
        history builds up.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" />;
}
