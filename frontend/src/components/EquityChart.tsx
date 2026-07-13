"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries, ColorType, UTCTimestamp } from "lightweight-charts";
import { EquitySnapshot } from "@/lib/api";

export default function EquityChart({ snapshots }: { snapshots: EquitySnapshot[] }) {
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
      height: 260,
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    const series = chart.addSeries(LineSeries, {
      color: "#f59e0b",
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
  }, [snapshots]);

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
