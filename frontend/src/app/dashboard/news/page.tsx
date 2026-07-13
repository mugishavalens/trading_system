"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { api, NewsItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const SENTIMENT_STYLES: Record<string, string> = {
  positive: "bg-success/15 text-success border-success/30",
  negative: "bg-danger/15 text-danger border-danger/30",
  neutral: "bg-surface-2 text-muted border-border",
};

const SENTIMENT_ICON: Record<string, typeof TrendingUp> = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
};

type Filter = "all" | "positive" | "negative" | "neutral";

export default function NewsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      const data = await api.news(token!, 50);
      if (!cancelled) setItems(data);
    }

    load();
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  const filtered = filter === "all" ? items : items.filter((i) => i.sentiment === filter);

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">News</h1>
        <p className="mt-1 text-sm text-muted">
          Synthetic news feed generated for this demo — headlines aren&apos;t
          from a real news source, but the sentiment/impact scoring works the
          same way a live News Intelligence module would.
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        {(["all", "positive", "negative", "neutral"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              filter === f
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((item) => {
          const Icon = SENTIMENT_ICON[item.sentiment];
          return (
            <div key={item.id} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-accent">{item.symbol}</p>
                  <p className="mt-1 font-semibold">{item.headline}</p>
                </div>
                <span
                  className={clsx(
                    "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
                    SENTIMENT_STYLES[item.sentiment]
                  )}
                >
                  <Icon size={12} />
                  {item.sentiment}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{item.summary}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>Impact score {item.impact_score}/10</span>
                <span>{new Date(item.published_at).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted">No headlines match this filter.</p>
        )}
      </div>
    </div>
  );
}
