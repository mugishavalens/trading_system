"use client";

import { useEffect, useState } from "react";
import { api, AdminAnalytics, AdminStats } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import BreakdownBars from "@/components/BreakdownBars";
import SignupsChart from "@/components/SignupsChart";
import FilterBar from "@/components/FilterBar";

export default function UserAnalyticsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!token) return;
    api.adminStats(token).then(setStats);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      const data = await api.adminAnalytics(token!, { date_from: dateFrom, date_to: dateTo });
      if (!cancelled) setAnalytics(data);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token, dateFrom, dateTo]);

  const topSymbolsData: Record<string, number> = {};
  for (const s of analytics?.top_symbols ?? []) {
    topSymbolsData[s.symbol] = s.trade_count;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">User Analytics</h1>
        <p className="mt-1 text-sm text-muted">
          Growth, onboarding classification, and trading volume by symbol.
        </p>
      </div>

      <FilterBar
        dateRange={{ from: dateFrom, to: dateTo, onFromChange: setDateFrom, onToChange: setDateTo }}
        onClear={() => { setDateFrom(""); setDateTo(""); }}
      />

      <div className="glass rounded-2xl p-5">
        <p className="text-sm font-medium">Signups Over Time</p>
        <p className="mt-1 text-xs text-muted">New accounts created per day.</p>
        <div className="mt-3">
          <SignupsChart data={analytics?.signups_by_day ?? []} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-medium">Top Traded Symbols</p>
          <p className="mt-1 text-xs text-muted">Share of trades by symbol (filtered range).</p>
          <div className="mt-4">
            {Object.keys(topSymbolsData).length > 0 ? (
              <BreakdownBars data={topSymbolsData} />
            ) : (
              <p className="text-sm text-muted">No trades in this range.</p>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-medium">Experience Level</p>
          <p className="mt-1 text-xs text-muted">How users classified themselves at signup.</p>
          <div className="mt-4">
            {stats && <BreakdownBars data={stats.experience_breakdown} />}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-medium">Risk Profile</p>
          <p className="mt-1 text-xs text-muted">Risk tolerance selected at signup.</p>
          <div className="mt-4">
            {stats && <BreakdownBars data={stats.risk_profile_breakdown} />}
          </div>
        </div>
      </div>
    </div>
  );
}
