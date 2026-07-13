"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  SlidersHorizontal,
  Activity,
  Mail,
  Globe2,
  BarChart3,
  Terminal,
} from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: SlidersHorizontal, label: "AI Control Center", href: "/admin/ai-control" },
  { icon: Globe2, label: "Market Intelligence", href: "/admin/market-intelligence" },
  { icon: BarChart3, label: "User Analytics", href: "/admin/analytics" },
  { icon: Terminal, label: "AI Command Center", href: "/admin/command-center" },
  { icon: Activity, label: "Activity Log", href: "/admin/activity" },
  { icon: Mail, label: "Messages", href: "/admin/messages" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface/60 p-4 md:flex">
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent">
          <ShieldCheck size={18} />
        </div>
        <span className="font-semibold">Admin Panel</span>
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
        Admin accounts manage the platform only — they don't hold demo funds
        or place trades.
      </div>
    </aside>
  );
}
