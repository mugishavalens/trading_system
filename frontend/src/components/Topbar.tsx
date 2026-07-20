"use client";

import Link from "next/link";
import { LogOut, Sun, Moon, Home } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import NotificationBell from "@/components/NotificationBell";

export default function Topbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="relative z-20 flex items-center justify-between border-b border-border bg-surface/60 px-6 py-4 backdrop-blur-sm">
      <div>
        <p className="text-xs text-muted">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-lg font-semibold">
          Good {timeOfDayGreeting()}, {user?.full_name?.split(" ")[0] ?? "Trader"} 👋
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Balance */}
        <div className="hidden sm:block text-right text-sm mr-2 rounded-xl border border-border bg-surface px-3 py-2">
          <p className="text-xs text-muted">Cash balance</p>
          <p className="font-semibold text-accent">
            {user ? user.cash_balance.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—"}
          </p>
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* Theme toggle */}
        <button onClick={toggleTheme} aria-label="Toggle theme" suppressHydrationWarning
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted hover:text-foreground hover:bg-surface transition-colors">
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Home link */}
        <Link href="/"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted hover:text-foreground hover:bg-surface transition-colors"
          title="Back to home">
          <Home size={15} />
        </Link>

        {/* Sign out */}
        <button onClick={logout}
          className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted hover:text-danger hover:border-danger/30 hover:bg-danger/5 transition-colors">
          <LogOut size={15} /> <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}

function timeOfDayGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}
