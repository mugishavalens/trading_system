"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Topbar() {
  const { user, logout } = useAuth();

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
          Good {timeOfDayGreeting()}, {user?.full_name?.split(" ")[0] ?? "Trader"} 👋
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right text-sm">
          <p className="text-muted">Cash balance</p>
          <p className="font-medium">
            {user
              ? user.cash_balance.toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                })
              : "—"}
          </p>
        </div>
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
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}
