"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  Bot,
  LineChart,
  Wallet,
  History,
  ShieldAlert,
  BookOpen,
  Newspaper,
  Settings,
} from "lucide-react";

const NAV = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Bot, label: "AI Assistant", href: "/dashboard/assistant" },
  { icon: LineChart, label: "Markets", href: "/dashboard/markets" },
  { icon: Wallet, label: "Portfolio", href: "/dashboard/portfolio" },
  { icon: History, label: "History", href: "/dashboard/history" },
  { icon: ShieldAlert, label: "Risk", href: "/dashboard/risk" },
  { icon: BookOpen, label: "Learn", href: "/dashboard/learn" },
  { icon: Newspaper, label: "News", href: "/dashboard/news" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface/60 p-4 md:flex">
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
          <Bot size={18} />
        </div>
        <span className="font-semibold">Trading Mentor</span>
      </div>

      <nav className="mt-6 flex flex-col gap-1">
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-accent/15 text-accent font-medium"
                  : "text-muted hover:bg-surface hover:text-foreground"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-border bg-background/60 p-3 text-xs text-muted">
        Demo mode — virtual funds only. Nothing here is financial advice.
      </div>
    </aside>
  );
}
