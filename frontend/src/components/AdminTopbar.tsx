"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { LogOut, ShieldCheck } from "lucide-react";
import { api, AdminHealth } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const HEALTH_POLL_MS = 15000;

export default function AdminTopbar() {
  const { user, token, logout } = useAuth();
  const [health, setHealth] = useState<AdminHealth | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      try {
        const h = await api.adminHealth(token!);
        if (!cancelled) setHealth(h);
      } catch {
        if (!cancelled) setHealth(null);
      }
    }
    load();
    const id = setInterval(load, HEALTH_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <div>
        <p className="text-sm text-muted">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-lg font-semibold">
          {timeOfDayGreeting()}, {user?.full_name?.split(" ")[0] ?? "Admin"}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <span
          className={clsx(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
            !health
              ? "bg-surface-2 text-muted"
              : health.status === "ok"
              ? "bg-success/15 text-success"
              : "bg-danger/15 text-danger"
          )}
        >
          <span className={clsx("h-1.5 w-1.5 rounded-full", health?.status === "ok" ? "bg-success" : health ? "bg-danger" : "bg-muted")} />
          {!health ? "Checking..." : health.status === "ok" ? "System OK" : "Degraded"}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-medium text-accent">
          <ShieldCheck size={14} /> Platform Admin
        </span>
        <button
          onClick={logout}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface transition-colors"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </header>
  );
}

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
