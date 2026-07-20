"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Plus, X } from "lucide-react";
import { api, PriceAlertItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const POLL_MS = 8000;

export default function PriceAlerts({ defaultSymbol }: { defaultSymbol: string }) {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlertItem[]>([]);
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setAlerts(await api.alerts(token));
  }, [token]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  async function handleAdd() {
    const price = parseFloat(target);
    if (!token || !price || price <= 0) return;
    setBusy(true);
    try {
      await api.createAlert(token, { symbol: defaultSymbol, condition, target_price: price });
      setTarget("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel(id: number) {
    if (!token) return;
    await api.cancelAlert(token, id);
    await refresh();
  }

  return (
    <div className="glass rounded-2xl">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3 text-sm font-medium">
        <Bell size={14} className="text-accent" /> Price Alerts
      </div>

      <div className="flex items-center gap-2 p-4">
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value as "above" | "below")}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="above">Above</option>
          <option value="below">Below</option>
        </select>
        <input
          type="number" min="0" step="0.0001" value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder={`${defaultSymbol} price`}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          onClick={handleAdd}
          disabled={busy || !target}
          title="Add alert"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-black hover:bg-accent-2 disabled:opacity-50 transition-colors"
        >
          <Plus size={15} />
        </button>
      </div>

      {alerts.length > 0 ? (
        <div className="divide-y divide-border">
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span>
                <span className="font-medium">{a.symbol}</span>{" "}
                <span className="text-muted">
                  {a.condition} {a.target_price.toLocaleString(undefined, { maximumFractionDigits: 5 })}
                </span>
              </span>
              <button
                onClick={() => handleCancel(a.id)}
                title="Remove alert"
                className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-4 pb-4 text-sm text-muted">
          No active alerts — set one above and we&rsquo;ll notify you when {defaultSymbol} crosses it.
        </p>
      )}
    </div>
  );
}
