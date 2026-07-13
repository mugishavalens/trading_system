"use client";

import { X } from "lucide-react";

export interface FilterSelect {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export default function FilterBar({
  search,
  selects = [],
  dateRange,
  onClear,
}: {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  selects?: FilterSelect[];
  dateRange?: {
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
  };
  onClear?: () => void;
}) {
  return (
    <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
      {search && (
        <input
          type="text"
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          placeholder={search.placeholder ?? "Search..."}
          className="min-w-[160px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      )}

      {selects.map((s) => (
        <select
          key={s.key}
          value={s.value}
          onChange={(e) => s.onChange(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="">{s.label}: All</option>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}

      {dateRange && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => dateRange.onFromChange(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => dateRange.onToChange(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent"
          />
        </div>
      )}

      {onClear && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-surface hover:text-foreground transition-colors"
        >
          <X size={14} /> Clear
        </button>
      )}
    </div>
  );
}
