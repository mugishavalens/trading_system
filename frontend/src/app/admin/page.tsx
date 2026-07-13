"use client";

import { useEffect, useState } from "react";
import { api, AdminStats, AIPerformance } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import StatCard from "@/components/StatCard";
import BreakdownBars from "@/components/BreakdownBars";

export default function AdminOverviewPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [aiPerf, setAiPerf] = useState<AIPerformance | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      const [s, p] = await Promise.all([
        api.adminStats(token!),
        api.adminAiPerformance(token!),
      ]);
      if (cancelled) return;
      setStats(s);
      setAiPerf(p);
    }

    load();
    const id = setInterval(load, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">System Overview</h1>
        <p className="mt-1 text-sm text-muted">
          Users, trading activity, and AI performance across the whole platform.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Users" value={stats ? String(stats.total_users) : "—"} />
        <StatCard
          label="Active Users"
          value={stats ? String(stats.active_users) : "—"}
          tone="success"
        />
        <StatCard label="Admins" value={stats ? String(stats.admin_users) : "—"} />
        <StatCard label="Trades Today" value={stats ? String(stats.trades_today) : "—"} />
        <StatCard
          label="Avg AI Confidence"
          value={stats ? `${stats.average_ai_confidence.toFixed(1)}%` : "—"}
          tone="accent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-medium">Trade Source</p>
          <p className="mt-1 text-xs text-muted">
            AI-executed vs. manually placed trades, platform-wide.
          </p>
          <div className="mt-4">
            {stats && (
              <BreakdownBars
                data={{
                  "AI executed": stats.ai_auto_trades,
                  Manual: stats.manual_trades,
                }}
              />
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-medium">AI Action Distribution</p>
          <p className="mt-1 text-xs text-muted">
            BUY vs. SELL trades executed across all users.
          </p>
          <div className="mt-4">
            {aiPerf && <BreakdownBars data={aiPerf.action_distribution} />}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-medium">Experience Level Breakdown</p>
          <p className="mt-1 text-xs text-muted">
            How users classified themselves at signup.
          </p>
          <div className="mt-4">
            {stats && <BreakdownBars data={stats.experience_breakdown} />}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-medium">Risk Profile Breakdown</p>
          <p className="mt-1 text-xs text-muted">
            Risk tolerance selected at signup.
          </p>
          <div className="mt-4">
            {stats && <BreakdownBars data={stats.risk_profile_breakdown} />}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="text-sm font-medium">AI Performance by Symbol</p>
        <p className="mt-1 text-xs text-muted">
          Realized P&amp;L and win rate across all users' closed trades, platform-wide.
        </p>
        <div className="mt-4 overflow-x-auto">
          {aiPerf && aiPerf.by_symbol.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-2 pr-4 font-medium">Symbol</th>
                  <th className="py-2 pr-4 font-medium">Trades</th>
                  <th className="py-2 pr-4 font-medium">Win Rate</th>
                  <th className="py-2 pr-4 font-medium">Realized P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {aiPerf.by_symbol.map((s) => (
                  <tr key={s.symbol} className="border-t border-border">
                    <td className="py-2 pr-4 font-medium">{s.symbol}</td>
                    <td className="py-2 pr-4">{s.trade_count}</td>
                    <td className="py-2 pr-4">{s.win_rate.toFixed(1)}%</td>
                    <td
                      className={`py-2 pr-4 ${
                        s.total_realized_pnl >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {s.total_realized_pnl >= 0 ? "+" : ""}
                      ${s.total_realized_pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted">No closed trades yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
