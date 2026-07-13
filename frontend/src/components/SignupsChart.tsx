"use client";

import { useEffect, useRef } from "react";
import { createChart, HistogramSeries, ColorType, UTCTimestamp } from "lightweight-charts";
import { DateCount } from "@/lib/api";

export default function SignupsChart({ data }: { data: DateCount[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      width: containerRef.current.clientWidth,
      height: 220,
      timeScale: { timeVisible: false },
    });

    const series = chart.addSeries(HistogramSeries, {
      color: "#f59e0b",
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
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted">
        No signups in this range yet.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" />;
}
