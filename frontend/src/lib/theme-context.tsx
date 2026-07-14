"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "ai_trading_demo_theme";

function resolveInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The inline script in layout.tsx already set data-theme on <html> before
  // hydration, so this initial state just needs to match what it picked —
  // it never causes a visible flash, only keeps React's state in sync.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // resolveInitialTheme() reads localStorage/matchMedia, which don't exist
    // during SSR — this can only run after mount. The layout.tsx blocking
    // script already painted the correct data-theme attribute before this
    // runs, so there's no visible flash; this just brings React's state in
    // sync with what's already on screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(resolveInitialTheme());
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
