"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LayoutDashboard, Users, ArrowLeftRight, ShieldCheck } from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
  { icon: Users, label: "Users", href: "/admin/users" },
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

      <Link
        href="/dashboard"
        className="mt-4 flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm text-muted hover:text-foreground hover:bg-surface transition-colors"
      >
        <ArrowLeftRight size={18} />
        Back to app
      </Link>
    </aside>
  );
}
