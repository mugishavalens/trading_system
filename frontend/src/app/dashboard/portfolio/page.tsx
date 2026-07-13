"use client";

import { useCallback, useEffect, useState } from "react";
import { api, EquitySnapshot, Portfolio, Trade } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import StatCard from "@/components/StatCard";
import AllocationPie from "@/components/AllocationPie";
import EquityChart from "@/components/EquityChart";
import PositionsTable from "@/components/PositionsTable";
import TradeHistoryTable from "@/components/TradeHistoryTable";

const POLL_MS = 8000;

export default function PortfolioPage() {
  const { token } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [history, setHistory] = useState<EquitySnapshot[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  const refresh = useCallback(async () => {
    if (!token) return;
    const [p, h, t] = await Promise.all([
      api.portfolio(token),
      api.portfolioHistory(token),
      api.tradeHistory(token),
    ]);
    setPortfolio(p);
    setHistory(h);
    setTrades(t);
  }, [token]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const slices = [
    ...(portfolio?.positions.map((p) => ({
      label: p.symbol,
      value: p.quantity * p.current_price,
    })) ?? []),
    { label: "Cash", value: portfolio?.cash_balance ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Portfolio</h1>
        <p className="mt-1 text-sm text-muted">
          Full allocation, equity history, and trade record for your demo account.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Equity"
          value={portfolio ? `$${portfolio.equity.toLocaleString()}` : "—"}
        />
        <StatCard
          label="Cash"
          value={portfolio ? `$${portfolio.cash_balance.toLocaleString()}` : "—"}
        />
        <StatCard
          label="Total P&L"
          value={
            portfolio
              ? `${portfolio.total_pnl >= 0 ? "+" : ""}$${portfolio.total_pnl.toFixed(2)}`
              : "—"
          }
          tone={portfolio && portfolio.total_pnl >= 0 ? "success" : "danger"}
          hint={portfolio ? `${portfolio.total_pnl_pct.toFixed(2)}%` : undefined}
        />
        <StatCard label="Risk Score" value={portfolio?.risk_score ?? "—"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <p className="text-sm font-medium">Equity Curve</p>
          <div className="mt-3">
            <EquityChart snapshots={history} />
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-medium">Allocation</p>
          <div className="mt-3">
            <AllocationPie slices={slices} />
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl">
        <div className="border-b border-border px-5 py-3 text-sm font-medium">
          Open Positions
        </div>
        <PositionsTable positions={portfolio?.positions ?? []} />
      </div>

      <div className="glass rounded-2xl">
        <div className="border-b border-border px-5 py-3 text-sm font-medium">
          Trade History
        </div>
        <TradeHistoryTable trades={trades} />
      </div>
    </div>
  );
}
