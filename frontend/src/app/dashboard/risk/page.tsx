"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { api, PortfolioRisk } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Gauge from "@/components/Gauge";
import BreakdownBars from "@/components/BreakdownBars";

const POLL_MS = 10000;

export default function RiskPage() {
  const { token } = useAuth();
  const [risk, setRisk] = useState<PortfolioRisk | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      const data = await api.portfolioRisk(token!);
      if (!cancelled) setRisk(data);
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  const exposureData: Record<string, number> = {};
  for (const e of risk?.exposures ?? []) {
    exposureData[e.symbol] = e.value;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Risk Center</h1>
        <p className="mt-1 text-sm text-muted">
          Your risk profile, current portfolio concentration, and the AI&apos;s exposure guidance.
        </p>
      </div>

      <div className="glass rounded-2xl p-6">
        <p className="font-semibold">Your Risk Profile</p>
        <p className="mt-1 text-sm capitalize text-muted">{risk?.risk_profile ?? "—"}</p>
        <div className="mt-4">
          {risk && <Gauge profile={risk.risk_profile} />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-medium">Current Exposure</p>
          <p className="mt-1 text-xs text-muted">
            Share of your equity held in each position right now.
          </p>
          <div className="mt-4">
            {risk && risk.exposures.length > 0 ? (
              <BreakdownBars data={exposureData} />
            ) : (
              <p className="text-sm text-muted">No open positions.</p>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-medium">Largest Concentration</p>
          <p className="mt-3 text-3xl font-semibold text-accent">
            {risk ? `${risk.largest_concentration_pct.toFixed(1)}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-muted">of equity in a single symbol.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <p className="flex items-center gap-2 font-semibold">
          <AlertTriangle size={16} className="text-accent" /> AI Recommendation
        </p>
        <div className="mt-3 space-y-2">
          {(risk?.recommendations ?? []).map((r, i) => (
            <p key={i} className="text-sm text-muted">
              {r}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
