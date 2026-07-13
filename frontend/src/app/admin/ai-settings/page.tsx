"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { api, AIEngineConfig, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type FieldKey = keyof Omit<AIEngineConfig, "updated_at">;

const WEIGHT_FIELDS: { key: FieldKey; label: string }[] = [
  { key: "rsi_weight", label: "RSI weight" },
  { key: "macd_weight", label: "MACD weight" },
  { key: "ema_weight", label: "EMA trend weight" },
  { key: "bollinger_weight", label: "Bollinger Bands weight" },
  { key: "sma_weight", label: "SMA weight" },
];

export default function AiSettingsPage() {
  const { token } = useAuth();
  const [config, setConfig] = useState<AIEngineConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.adminGetAiConfig(token).then(setConfig);
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
      const { updated_at: _updated_at, ...payload } = config;
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

  if (!config) {
    return <p className="text-muted">Loading...</p>;
  }

  const weightSum = WEIGHT_FIELDS.reduce((sum, f) => sum + config[f.key], 0);

  return (
    <div className="mx-auto max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">AI Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Tune the weights and thresholds behind every AI recommendation and
          the autopilot trader — this is the closest thing this rule-based
          engine has to "retraining."
        </p>
      </div>

      <div className="glass mt-6 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Indicator weights</p>
          <span
            className={`text-xs ${
              Math.abs(weightSum - 1) < 0.05 ? "text-muted" : "text-danger"
            }`}
          >
            Sum: {weightSum.toFixed(2)} (should be close to 1.00)
          </span>
        </div>
        <div className="mt-4 space-y-4">
          {WEIGHT_FIELDS.map((f) => (
            <div key={f.key}>
              <div className="flex justify-between text-sm">
                <label className="text-muted">{f.label}</label>
                <span>{config[f.key].toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={config[f.key]}
                onChange={(e) => update(f.key, parseFloat(e.target.value))}
                className="mt-1 w-full accent-amber-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="glass mt-6 rounded-2xl p-6">
        <p className="font-semibold">Decision thresholds</p>
        <p className="mt-1 text-xs text-muted">
          The weighted score (-1 to +1) must cross these to become a BUY or SELL instead of HOLD.
        </p>
        <div className="mt-4 space-y-4">
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

      <div className="glass mt-6 rounded-2xl p-6">
        <p className="font-semibold">Autopilot</p>
        <p className="mt-1 text-xs text-muted">
          Minimum confidence before the autopilot background loop will place a trade for any user
          who has it enabled.
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
            onChange={(e) =>
              update("autopilot_confidence_floor", parseFloat(e.target.value))
            }
            className="mt-1 w-full accent-amber-500"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      {saved && (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 size={14} /> Saved — new recommendations use these values immediately.
        </p>
      )}

      <div className="mt-6 flex gap-3">
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
