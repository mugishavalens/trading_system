"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  Bot,
  LineChart,
  Wallet,
  BookOpen,
  Newspaper,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: Bot, label: "AI Assistant", href: "/dashboard/assistant" },
  { icon: LineChart, label: "Markets", href: "/dashboard/markets" },
  { icon: Wallet, label: "Portfolio", href: "/dashboard/portfolio" },
  { icon: BookOpen, label: "Learn", href: "/dashboard/learn" },
  { icon: Newspaper, label: "News", href: null },
  { icon: Settings, label: "Settings", href: null },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

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
          const active = href ? pathname === href : false;
          if (!href) {
            return (
              <div
                key={label}
                title="Coming soon in this demo"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted cursor-not-allowed opacity-50"
              >
                <Icon size={18} />
                {label}
              </div>
            );
          }
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

      {user?.role === "admin" && (
        <Link
          href="/admin"
          className="mt-4 flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm font-medium text-accent hover:bg-accent/20 transition-colors"
        >
          <ShieldCheck size={18} />
          Admin Panel
        </Link>
      )}

      <div className="mt-auto rounded-lg border border-border bg-background/60 p-3 text-xs text-muted">
        Demo mode — virtual funds only. Nothing here is financial advice.
      </div>
    </aside>
  );
}
