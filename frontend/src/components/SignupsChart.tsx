"use client";

import { useEffect, useRef } from "react";
import { createChart, HistogramSeries, ColorType, UTCTimestamp } from "lightweight-charts";
import { DateCount } from "@/lib/api";
import { chartColors } from "@/lib/chartTheme";
import { useTheme } from "@/lib/theme-context";

export default function SignupsChart({ data }: { data: DateCount[] }) {
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
      height: 220,
      timeScale: { timeVisible: false },
    });

    const series = chart.addSeries(HistogramSeries, {
      color: colors.accent,
    });

    series.setData(
      data.map((d) => ({
        time: (new Date(`${d.date}T00:00:00Z`).getTime() / 1000) as UTCTimestamp,
        value: d.count,
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
  }, [data, theme]);

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted">
        No signups in this range yet.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" />;
}
