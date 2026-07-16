"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, ApiError, UserResponse } from "./api";

interface AuthContextValue {
  token: string | null;
  user: UserResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserResponse>;
  register: (payload: {
    full_name: string;
    email: string;
    password: string;
    experience_level: string;
    risk_profile: string;
  }) => Promise<UserResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "ai_trading_demo_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (tok: string) => {
    try {
      const u = await api.me(tok);
      setUser(u);
      return u;
    } catch (err) {
      // Only clear the session on a genuine 401 — an expired or invalid token.
      // Network errors (backend restarting, offline, etc.) must NOT log the user
      // out; the token is still valid and the session should survive.
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        setToken(null);
        localStorage.removeItem(STORAGE_KEY);
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setToken(stored);
      loadUser(stored)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [loadUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login({ email, password });
      localStorage.setItem(STORAGE_KEY, res.access_token);
      setToken(res.access_token);
      return loadUser(res.access_token);
    },
    [loadUser]
  );

  const register = useCallback(
    async (payload: {
      full_name: string;
      email: string;
      password: string;
      experience_level: string;
      risk_profile: string;
    }) => {
      const res = await api.register(payload);
      localStorage.setItem(STORAGE_KEY, res.access_token);
      setToken(res.access_token);
      return loadUser(res.access_token);
    },
    [loadUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (token) await loadUser(token);
  }, [token, loadUser]);

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
