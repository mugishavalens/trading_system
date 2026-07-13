const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  register: (payload: {
    full_name: string;
    email: string;
    password: string;
    experience_level: string;
    risk_profile: string;
  }) =>
    request<{ access_token: string; token_type: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ access_token: string; token_type: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: (token: string) => request<UserResponse>("/api/auth/me", { token }),

  symbols: () => request<SymbolInfo[]>("/api/market/symbols"),

  candles: (symbol: string, limit = 120) =>
    request<Candle[]>(
      `/api/market/candles/${encodeURIComponent(symbol)}?limit=${limit}`
    ),

  recommendations: (token: string) =>
    request<AIRecommendation[]>("/api/ai/recommendations", { token }),

  recommendation: (token: string, symbol: string) =>
    request<AIRecommendation>(
      `/api/ai/recommendation/${encodeURIComponent(symbol)}`,
      { token }
    ),

  explain: (token: string, symbol: string) =>
    request<{ symbol: string; explanation: string; generated_by: string }>(
      `/api/ai/explain/${encodeURIComponent(symbol)}`,
      { token }
    ),

  executeTrade: (
    token: string,
    payload: { symbol: string; side: "BUY" | "SELL"; quantity: number }
  ) =>
    request<Trade>("/api/trading/execute", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),

  executeAiTrade: (token: string, symbol: string) =>
    request<Trade>(`/api/trading/execute-ai/${encodeURIComponent(symbol)}`, {
      method: "POST",
      token,
    }),

  tradeHistory: (token: string) =>
    request<Trade[]>("/api/trading/history", { token }),

  portfolio: (token: string) =>
    request<Portfolio>("/api/portfolio", { token }),

  portfolioHistory: (token: string) =>
    request<EquitySnapshot[]>("/api/portfolio/history", { token }),

  chat: (token: string, message: string, history: ChatMessage[]) =>
    request<ChatResponse>("/api/assistant/chat", {
      method: "POST",
      token,
      body: JSON.stringify({ message, history }),
    }),

  adminUsers: (token: string) =>
    request<AdminUser[]>("/api/admin/users", { token }),

  adminSuspendUser: (token: string, userId: number) =>
    request<AdminUser>(`/api/admin/users/${userId}/suspend`, {
      method: "POST",
      token,
    }),

  adminPromoteUser: (token: string, userId: number) =>
    request<AdminUser>(`/api/admin/users/${userId}/promote`, {
      method: "POST",
      token,
    }),

  adminDeleteUser: (token: string, userId: number) =>
    request<{ status: string }>(`/api/admin/users/${userId}`, {
      method: "DELETE",
      token,
    }),

  adminStats: (token: string) =>
    request<AdminStats>("/api/admin/stats", { token }),

  adminAiPerformance: (token: string) =>
    request<AIPerformance>("/api/admin/ai-performance", { token }),
};

// ---- Types ----

export interface UserResponse {
  id: number;
  full_name: string;
  email: string;
  experience_level: "beginner" | "intermediate" | "advanced";
  risk_profile: "conservative" | "moderate" | "aggressive";
  role: "user" | "admin";
  is_active: boolean;
  cash_balance: number;
}

export interface SymbolInfo {
  symbol: string;
  name: string;
  asset_class: string;
  last_price: number;
  change_pct_24h: number;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorSnapshot {
  rsi: number;
  macd: number;
  macd_signal: number;
  ema_20: number;
  ema_50: number;
  sma_20: number;
  bollinger_upper: number;
  bollinger_lower: number;
  atr: number;
}

export interface AIRecommendation {
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  risk_level: string;
  expected_return_pct: number;
  reasons: string[];
  indicators: IndicatorSnapshot;
  price: number;
  generated_at: string;
  disclaimer: string;
}

export interface Trade {
  id: number;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  realized_pnl: number | null;
  confidence: number | null;
  risk_level: string | null;
  reason: string | null;
  source: string;
  executed_at: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  avg_entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
}

export interface Portfolio {
  cash_balance: number;
  equity: number;
  total_pnl: number;
  total_pnl_pct: number;
  win_rate: number;
  risk_score: string;
  positions: Position[];
}

export interface EquitySnapshot {
  equity: number;
  recorded_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  generated_by: "claude" | "faq";
}

export interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  experience_level: "beginner" | "intermediate" | "advanced";
  risk_profile: "conservative" | "moderate" | "aggressive";
  role: "user" | "admin";
  is_active: boolean;
  cash_balance: number;
  created_at: string;
  trade_count: number;
  equity: number;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  admin_users: number;
  total_trades: number;
  trades_today: number;
  ai_auto_trades: number;
  manual_trades: number;
  average_ai_confidence: number;
  experience_breakdown: Record<string, number>;
  risk_profile_breakdown: Record<string, number>;
}

export interface SymbolPerformance {
  symbol: string;
  trade_count: number;
  total_realized_pnl: number;
  win_rate: number;
}

export interface AIPerformance {
  overall_win_rate: number;
  average_confidence: number;
  action_distribution: Record<string, number>;
  best_symbol: SymbolPerformance | null;
  worst_symbol: SymbolPerformance | null;
  by_symbol: SymbolPerformance[];
}
