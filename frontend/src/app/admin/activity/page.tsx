"use client";

import { useEffect, useState } from "react";
import { api, AdminTrade } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ActivityLogPage() {
  const { token } = useAuth();
  const [trades, setTrades] = useState<AdminTrade[]>([]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      const data = await api.adminActivity(token!, 150);
      if (!cancelled) setTrades(data);
    }

    load();
    const id = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  return (
    <div>
      <div>
        <h1 className="text-xl font-semibold">Activity Log</h1>
        <p className="mt-1 text-sm text-muted">
          Every trade placed on the platform, across all users, most recent first.
        </p>
      </div>

      <div className="glass mt-4 overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Symbol</th>
              <th className="px-5 py-3 font-medium">Side</th>
              <th className="px-5 py-3 font-medium">Qty</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Confidence</th>
              <th className="px-5 py-3 font-medium">Realized P&amp;L</th>
              <th className="px-5 py-3 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-5 py-3 text-muted">
                  {new Date(t.executed_at).toLocaleString()}
                </td>
                <td className="px-5 py-3">{t.user_email}</td>
                <td className="px-5 py-3 font-medium">{t.symbol}</td>
                <td className={t.side === "BUY" ? "px-5 py-3 text-success" : "px-5 py-3 text-danger"}>
                  {t.side}
                </td>
                <td className="px-5 py-3">{t.quantity.toFixed(4)}</td>
                <td className="px-5 py-3">${t.price.toFixed(2)}</td>
                <td className="px-5 py-3">{t.confidence?.toFixed(0) ?? "—"}%</td>
                <td className="px-5 py-3">
                  {t.realized_pnl != null ? (
                    <span className={t.realized_pnl >= 0 ? "text-success" : "text-danger"}>
                      {t.realized_pnl >= 0 ? "+" : ""}${t.realized_pnl.toFixed(2)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-5 py-3 text-muted">{t.source === "ai_auto" ? "AI" : "Manual"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {trades.length === 0 && (
          <p className="p-5 text-sm text-muted">No trades yet.</p>
        )}
      </div>
    </div>
  );
}
