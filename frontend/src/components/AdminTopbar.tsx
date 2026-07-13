"use client";

import { LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function AdminTopbar() {
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
          {timeOfDayGreeting()}, {user?.full_name?.split(" ")[0] ?? "Admin"}
        </h1>
      </div>
      <div className="flex items-center gap-4">
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
