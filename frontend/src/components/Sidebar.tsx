"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import {
  Home, Bot, LineChart, Wallet, History,
  ShieldAlert, Settings, ArrowLeft, ChevronLeft, ChevronRight,
} from "lucide-react";

const NAV = [
  { icon: Home,        label: "Dashboard",    href: "/dashboard" },
  { icon: Bot,         label: "AI Assistant", href: "/dashboard/assistant" },
  { icon: LineChart,   label: "Markets",      href: "/dashboard/markets" },
  { icon: Wallet,      label: "Portfolio",    href: "/dashboard/portfolio" },
  { icon: History,     label: "History",      href: "/dashboard/history" },
  { icon: ShieldAlert, label: "Risk",         href: "/dashboard/risk" },
  { icon: Settings,    label: "Settings",     href: "/dashboard/settings" },
];

export default function Sidebar() {
  const pathname    = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        "hidden md:flex flex-col shrink-0 border-r border-border bg-surface/60 transition-all duration-300 ease-in-out",
        collapsed ? "w-[60px] p-2" : "w-60 p-4"
      )}
    >
      {/* Logo / collapse toggle row */}
      <div className={clsx("flex items-center", collapsed ? "justify-center" : "justify-between px-1")}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent group-hover:bg-accent/30 transition-colors">
              <Bot size={18} />
            </div>
            <span className="font-semibold group-hover:text-accent transition-colors truncate">
              Trading Mentor
            </span>
          </Link>
        )}

        {collapsed && (
          <Link href="/" title="Home">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors">
              <Bot size={18} />
            </div>
          </Link>
        )}

        <button
          onClick={() => setCollapsed((v) => !v)}
          className={clsx(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground hover:bg-surface-2 transition-colors",
            collapsed && "mt-2"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* Nav links */}
      <nav className="mt-6 flex flex-col gap-1">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              title={collapsed ? label : undefined}
              className={clsx(
                "flex items-center rounded-lg transition-colors",
                collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                "text-sm",
                active
                  ? "bg-accent/15 text-accent font-medium"
                  : "text-muted hover:bg-surface hover:text-foreground"
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Back to home */}
      <div className={clsx("mt-4 border-t border-border pt-4")}>
        <Link
          href="/"
          title={collapsed ? "Back to Home" : undefined}
          className={clsx(
            "flex items-center rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface transition-colors",
            collapsed ? "justify-center px-0 py-2.5" : "gap-2 px-3 py-2.5"
          )}
        >
          <ArrowLeft size={16} className="shrink-0" />
          {!collapsed && <span>Back to Home</span>}
        </Link>
      </div>

      {/* Demo note */}
      {!collapsed && (
        <div className="mt-auto rounded-lg border border-border bg-background/60 p-3 text-xs text-muted">
          Demo mode — virtual funds only. Nothing here is financial advice.
        </div>
      )}
    </aside>
  );
}
