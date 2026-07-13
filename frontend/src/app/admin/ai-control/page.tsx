"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Pause, Play, RotateCcw } from "lucide-react";
import clsx from "clsx";
import { api, AdminHealth, AIEngineConfig, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import CountUp from "@/components/CountUp";

type FieldKey = keyof Omit<AIEngineConfig, "updated_at" | "autopilot_paused">;

const SIGNAL_MODULES: { key: FieldKey; label: string; description: string }[] = [
  { key: "rsi_weight", label: "RSI", description: "Oversold / overbought momentum" },
  { key: "macd_weight", label: "MACD", description: "Trend momentum crossover" },
  { key: "ema_weight", label: "EMA Trend", description: "20 vs 50-period trend direction" },
  { key: "bollinger_weight", label: "Bollinger Bands", description: "Price vs volatility bands" },
  { key: "sma_weight", label: "SMA", description: "Price vs 20-period average" },
];

const HEALTH_POLL_MS = 8000;

export default function AiControlCenterPage() {
  const { token } = useAuth();
  const [config, setConfig] = useState<AIEngineConfig | null>(null);
  const [health, setHealth] = useState<AdminHealth | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pauseBusy, setPauseBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.adminGetAiConfig(token).then(setConfig);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      const h = await api.adminHealth(token!);
      if (!cancelled) setHealth(h);
    }
    load();
    const id = setInterval(load, HEALTH_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  function update(key: FieldKey, value: number) {
    if (!config) return;
    setConfig({ ...config, [key]: value });
    setSaved(false);
  }

  async function save() {
    if (!token || !config) return;
    setError(null);
    setSaving(true);
    try {
      const { updated_at: _updated_at, autopilot_paused: _paused, ...payload } = config;
      const result = await api.adminUpdateAiConfig(token, payload);
      setConfig(result);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save config");
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!token) return;
    setError(null);
    setSaving(true);
    try {
      const result = await api.adminResetAiConfig(token);
      setConfig(result);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset config");
    } finally {
      setSaving(false);
    }
  }

  async function togglePause() {
    if (!token || !config) return;
    setPauseBusy(true);
    try {
      const result = config.autopilot_paused
        ? await api.adminResumeAutopilot(token)
        : await api.adminPauseAutopilot(token);
      setConfig(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update autopilot");
    } finally {
      setPauseBusy(false);
    }
  }

  if (!config) {
    return <p className="text-muted">Loading...</p>;
  }

  const weightSum = SIGNAL_MODULES.reduce((sum, f) => sum + config[f.key], 0);
  const paused = config.autopilot_paused;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">AI Control Center</h1>
        <p className="mt-1 text-sm text-muted">
          The real, single rule-based engine behind every recommendation — its live status,
          the signal modules that feed it, and the decision thresholds that turn a score into
          BUY/SELL/HOLD.
        </p>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={clsx(
                "flex h-3 w-3 rounded-full",
                paused ? "bg-muted" : "bg-success animate-pulse"
              )}
            />
            <div>
              <p className="font-semibold">
                Autopilot Engine — {paused ? "Paused" : "Running"}
              </p>
              <p className="text-xs text-muted">
                {health?.autopilot.last_run_at
                  ? `Last tick ${new Date(health.autopilot.last_run_at).toLocaleTimeString()} · every ${health.autopilot.run_interval_seconds}s`
                  : "Waiting for first tick..."}
              </p>
            </div>
          </div>
          <button
            onClick={togglePause}
            disabled={pauseBusy}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-colors disabled:opacity-60",
              paused
                ? "bg-accent text-black hover:bg-accent-2"
                : "border border-danger/30 text-danger hover:bg-danger/10"
            )}
          >
            {pauseBusy && <Loader2 size={14} className="animate-spin" />}
            {paused ? <Play size={14} /> : <Pause size={14} />}
            {paused ? "Resume autopilot" : "Pause autopilot"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted">Trades placed (last tick)</p>
            <p className="mt-1 text-lg font-semibold">
              <CountUp value={health?.autopilot.last_trades_placed ?? 0} />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Trades proposed (assisted)</p>
            <p className="mt-1 text-lg font-semibold">
              <CountUp value={health?.autopilot.last_trades_proposed ?? 0} />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Database</p>
            <p className={clsx("mt-1 text-lg font-semibold", health?.database_ok ? "text-success" : "text-danger")}>
              {health ? (health.database_ok ? "Healthy" : "Unreachable") : "—"}
            </p>
          </div>
        </div>
        {health?.autopilot.last_error && (
          <p className="mt-3 text-xs text-danger">Last error: {health.autopilot.last_error}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="font-semibold">Signal Modules</p>
          <span
            className={clsx("text-xs", Math.abs(weightSum - 1) < 0.05 ? "text-muted" : "text-danger")}
          >
            Weights sum to {weightSum.toFixed(2)} (should be close to 1.00)
          </span>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SIGNAL_MODULES.map((m) => (
            <div key={m.key} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium">{m.label}</p>
                <span className="text-sm text-accent">{config[m.key].toFixed(2)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{m.description}</p>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={config[m.key]}
                onChange={(e) => update(m.key, parseFloat(e.target.value))}
                className="mt-4 w-full accent-amber-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <p className="font-semibold">Decision thresholds</p>
        <p className="mt-1 text-xs text-muted">
          The weighted score (-1 to +1) must cross these to become a BUY or SELL instead of HOLD.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex justify-between text-sm">
              <label className="text-muted">BUY threshold</label>
              <span>{config.buy_threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.6}
              step={0.01}
              value={config.buy_threshold}
              onChange={(e) => update("buy_threshold", parseFloat(e.target.value))}
              className="mt-1 w-full accent-amber-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <label className="text-muted">SELL threshold</label>
              <span>{config.sell_threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={-0.6}
              max={0}
              step={0.01}
              value={config.sell_threshold}
              onChange={(e) => update("sell_threshold", parseFloat(e.target.value))}
              className="mt-1 w-full accent-amber-500"
            />
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <p className="font-semibold">Autopilot confidence floor</p>
        <p className="mt-1 text-xs text-muted">
          Minimum confidence before the autopilot loop will act on a signal for any user who has
          it enabled (autonomous execution or an assisted-mode proposal).
        </p>
        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <label className="text-muted">Confidence floor</label>
            <span>{config.autopilot_confidence_floor.toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={95}
            step={1}
            value={config.autopilot_confidence_floor}
            onChange={(e) => update("autopilot_confidence_floor", parseFloat(e.target.value))}
            className="mt-1 w-full accent-amber-500"
          />
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && (
        <p className="flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 size={14} /> Saved — new recommendations use these values immediately.
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-medium text-black hover:bg-accent-2 disabled:opacity-60 transition-colors"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Save changes
        </button>
        <button
          onClick={reset}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 font-medium hover:bg-surface disabled:opacity-60 transition-colors"
        >
          <RotateCcw size={14} />
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
