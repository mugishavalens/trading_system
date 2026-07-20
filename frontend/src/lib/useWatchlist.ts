"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

/** Shared watchlist state so the dashboard symbol list and the Markets page
 * stay in sync without each maintaining its own copy. */
export function useWatchlist() {
  const { token } = useAuth();
  const [symbols, setSymbols] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!token) return;
    const items = await api.watchlist(token);
    setSymbols(new Set(items.map((i) => i.symbol)));
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (symbol: string) => {
      if (!token) return;
      const isIn = symbols.has(symbol);
      // Optimistic update — the star should feel instant.
      setSymbols((prev) => {
        const next = new Set(prev);
        if (isIn) next.delete(symbol);
        else next.add(symbol);
        return next;
      });
      try {
        if (isIn) await api.removeFromWatchlist(token, symbol);
        else await api.addToWatchlist(token, symbol);
      } catch {
        await refresh(); // reconcile if the optimistic update was wrong
      }
    },
    [token, symbols, refresh]
  );

  return { watchlist: symbols, toggleWatchlist: toggle };
}
