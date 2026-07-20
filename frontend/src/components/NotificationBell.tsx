"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { api, NotificationItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const POLL_MS = 8000;

const TYPE_ICON: Record<NotificationItem["type"], string> = {
  order_filled: "📥",
  sl_tp_triggered: "🎯",
  price_alert: "🔔",
  pending_trade_proposed: "🤖",
  autopilot_trade: "⚡",
};

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell() {
  const { token } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadItems = items.filter((n) => !n.is_read);

  const refresh = useCallback(async () => {
    if (!token) return;
    // Unread-only, not "most recent 30 total" — otherwise an old unread
    // notification outside that window would inflate the badge with no way
    // to ever clear it from the list.
    const [list, { count }] = await Promise.all([
      api.notifications(token, 100, true),
      api.unreadNotificationCount(token),
    ]);
    setItems(list);
    setUnread(count);
  }, [token]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleMarkAllRead() {
    if (!token) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    await api.markAllNotificationsRead(token);
  }

  async function handleItemClick(n: NotificationItem) {
    if (!token || n.is_read) return;
    // Opening a notification acknowledges it — it drops out of the (unread) list
    // and the badge count, same as any normal notification tray.
    setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, is_read: true } : it)));
    setUnread((prev) => Math.max(0, prev - 1));
    try {
      await api.markNotificationRead(token, n.id);
    } catch {
      await refresh(); // reconcile if the optimistic update was wrong
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted hover:text-foreground hover:bg-surface transition-colors"
      >
        <Bell size={15} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Notifications</span>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent-2 transition-colors"
              >
                <Check size={11} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {unreadItems.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted">You&rsquo;re all caught up.</p>
            )}
            {unreadItems.map((n) => (
              <button
                key={n.id}
                onClick={() => handleItemClick(n)}
                title="Mark as read"
                className="flex w-full flex-col items-start gap-1 bg-accent/5 px-3 py-2.5 text-left text-sm hover:bg-accent/10 transition-colors"
              >
                <p className="flex gap-2">
                  <span>{TYPE_ICON[n.type]}</span>
                  <span className="flex-1 text-foreground/90">{n.message}</span>
                </p>
                <p className="pl-6 text-xs text-muted">{timeAgo(n.created_at)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
