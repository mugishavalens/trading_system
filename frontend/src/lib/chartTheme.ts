import { Theme } from "./theme-context";

// lightweight-charts renders to <canvas>, so it can't pick up CSS variables
// on its own — these must stay in sync with the matching values in
// globals.css by hand.
export interface ChartColors {
  textColor: string;
  gridColor: string;
  accent: string;
  success: string;
  danger: string;
}

const DARK_CHART_COLORS: ChartColors = {
  textColor: "#94a3b8",
  gridColor: "#1e293b",
  accent: "#f59e0b",
  success: "#22c55e",
  danger: "#ef4444",
};

const LIGHT_CHART_COLORS: ChartColors = {
  textColor: "#64748b",
  gridColor: "#e2e8f0",
  accent: "#b45309",
  success: "#16a34a",
  danger: "#dc2626",
};

export function chartColors(theme: Theme): ChartColors {
  return theme === "light" ? LIGHT_CHART_COLORS : DARK_CHART_COLORS;
}

// A shared multi-series palette (allocation pie, etc.) that stays legible on
// both a dark and a white background — only the "track"/background stroke
// needs a separate per-theme value (see chartColors().gridColor for that).
export const SERIES_PALETTE = ["#f59e0b", "#22c55e", "#38bdf8", "#a78bfa", "#f472b6", "#fb923c"];
