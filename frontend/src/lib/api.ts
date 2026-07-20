const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
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

  updateProfile: (
    token: string,
    payload: Partial<{
      experience_level: string;
      risk_profile: string;
      auto_trade_enabled: boolean;
      trading_mode: TradingMode;
    }>
  ) =>
    request<UserResponse>("/api/auth/profile", {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    }),

  changePassword: (
    token: string,
    payload: { current_password: string; new_password: string }
  ) =>
    request<{ status: string }>("/api/auth/change-password", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),

  forgotPassword: (email: string) =>
    request<{ reset_token: string; message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, new_password: string) =>
    request<{ status: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    }),

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

  debate: (token: string, symbol: string) =>
    request<DebateResult>(`/api/ai/debate/${encodeURIComponent(symbol)}`, { token }),

  executeTrade: (
    token: string,
    payload: {
      symbol: string;
      side: "BUY" | "SELL";
      quantity: number;
      stop_loss?: number;
      take_profit?: number;
      deviation?: number;
      reference_price?: number;
    }
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

  indicatorSeries: (symbol: string, limit = 120) =>
    request<IndicatorSeries>(
      `/api/market/indicators/${encodeURIComponent(symbol)}?limit=${limit}`
    ),

  // ---- Orders (limit/stop) ----
  createOrder: (
    token: string,
    payload: {
      symbol: string;
      side: "BUY" | "SELL";
      order_type: "limit" | "stop";
      trigger_price: number;
      quantity: number;
      stop_loss?: number;
      take_profit?: number;
      deviation?: number;
      expires_in_hours?: number;
    }
  ) =>
    request<Order>("/api/trading/orders", { method: "POST", token, body: JSON.stringify(payload) }),

  listOrders: (token: string) => request<Order[]>("/api/trading/orders", { token }),

  cancelOrder: (token: string, id: number) =>
    request<Order>(`/api/trading/orders/${id}`, { method: "DELETE", token }),

  // ---- Watchlist ----
  watchlist: (token: string) => request<WatchlistItem[]>("/api/watchlist", { token }),

  addToWatchlist: (token: string, symbol: string) =>
    request<WatchlistItem>("/api/watchlist", {
      method: "POST",
      token,
      body: JSON.stringify({ symbol }),
    }),

  removeFromWatchlist: (token: string, symbol: string) =>
    request<{ status: string }>(`/api/watchlist/${encodeURIComponent(symbol)}`, {
      method: "DELETE",
      token,
    }),

  // ---- Price alerts ----
  alerts: (token: string) => request<PriceAlertItem[]>("/api/alerts", { token }),

  createAlert: (
    token: string,
    payload: { symbol: string; condition: "above" | "below"; target_price: number }
  ) => request<PriceAlertItem>("/api/alerts", { method: "POST", token, body: JSON.stringify(payload) }),

  cancelAlert: (token: string, id: number) =>
    request<{ status: string }>(`/api/alerts/${id}`, { method: "DELETE", token }),

  // ---- Notifications ----
  notifications: (token: string, limit = 50, unreadOnly = false) =>
    request<NotificationItem[]>(
      `/api/notifications?limit=${limit}${unreadOnly ? "&unread_only=true" : ""}`,
      { token }
    ),

  unreadNotificationCount: (token: string) =>
    request<{ count: number }>("/api/notifications/unread-count", { token }),

  markNotificationRead: (token: string, id: number) =>
    request<NotificationItem>(`/api/notifications/${id}/read`, { method: "POST", token }),

  markAllNotificationsRead: (token: string) =>
    request<{ status: string }>("/api/notifications/read-all", { method: "POST", token }),

  tradeHistory: (
    token: string,
    filters: {
      symbol?: string;
      side?: string;
      date_from?: string;
      date_to?: string;
      offset?: number;
      limit?: number;
    } = {}
  ) =>
    request<Trade[]>(`/api/trading/history${buildQuery(filters)}`, { token }),

  pendingTrades: (token: string) =>
    request<PendingTrade[]>("/api/trading/pending", { token }),

  approvePendingTrade: (token: string, id: number, quantity?: number) =>
    request<Trade>(`/api/trading/pending/${id}/approve`, {
      method: "POST",
      token,
      body: JSON.stringify(quantity !== undefined ? { quantity } : {}),
    }),

  rejectPendingTrade: (token: string, id: number) =>
    request<PendingTrade>(`/api/trading/pending/${id}/reject`, { method: "POST", token }),

  portfolio: (token: string) =>
    request<Portfolio>("/api/portfolio", { token }),

  portfolioRisk: (token: string) =>
    request<PortfolioRisk>("/api/portfolio/risk", { token }),

  portfolioHistory: (token: string) =>
    request<EquitySnapshot[]>("/api/portfolio/history", { token }),

  chat: (token: string, message: string, history: ChatMessage[]) =>
    request<ChatResponse>("/api/assistant/chat", {
      method: "POST",
      token,
      body: JSON.stringify({ message, history }),
    }),

  adminUsers: (
    token: string,
    filters: { search?: string; role?: string; status?: string; offset?: number; limit?: number } = {}
  ) => request<AdminUser[]>(`/api/admin/users${buildQuery(filters)}`, { token }),

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

  adminActivity: (
    token: string,
    filters: {
      symbol?: string;
      side?: string;
      source?: string;
      user?: string;
      date_from?: string;
      date_to?: string;
      offset?: number;
      limit?: number;
    } = {}
  ) => request<AdminTrade[]>(`/api/admin/activity${buildQuery(filters)}`, { token }),

  adminGetAiConfig: (token: string) =>
    request<AIEngineConfig>("/api/admin/ai-config", { token }),

  adminUpdateAiConfig: (token: string, payload: AIEngineConfigInput) =>
    request<AIEngineConfig>("/api/admin/ai-config", {
      method: "PUT",
      token,
      body: JSON.stringify(payload),
    }),

  adminResetAiConfig: (token: string) =>
    request<AIEngineConfig>("/api/admin/ai-config/reset", {
      method: "POST",
      token,
    }),

  adminPauseAutopilot: (token: string) =>
    request<AIEngineConfig>("/api/admin/ai-config/pause", { method: "POST", token }),

  adminResumeAutopilot: (token: string) =>
    request<AIEngineConfig>("/api/admin/ai-config/resume", { method: "POST", token }),

  adminHealth: (token: string) =>
    request<AdminHealth>("/api/admin/health", { token }),

  adminAnalytics: (token: string, filters: { date_from?: string; date_to?: string } = {}) =>
    request<AdminAnalytics>(`/api/admin/analytics${buildQuery(filters)}`, { token }),

  adminMarketSummary: (token: string) =>
    request<MarketSummary>("/api/admin/market-summary", { token }),

  adminAiQuery: (token: string, question: string) =>
    request<AiQueryResult>("/api/admin/ai-query", {
      method: "POST",
      token,
      body: JSON.stringify({ question }),
    }),

  adminMessages: (token: string) =>
    request<ContactMessage[]>("/api/admin/messages", { token }),

  adminMarkMessageRead: (token: string, id: number) =>
    request<ContactMessage>(`/api/admin/messages/${id}/read`, {
      method: "POST",
      token,
    }),

  adminDeleteMessage: (token: string, id: number) =>
    request<{ status: string }>(`/api/admin/messages/${id}`, {
      method: "DELETE",
      token,
    }),

  news: (limit = 50) =>
    request<NewsItem[]>(`/api/news?limit=${limit}`),

  submitContact: (payload: { name: string; email: string; message: string }) =>
    request<{ status: string }>("/api/contact", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ---- Types ----

export type TradingMode = "manual" | "assisted" | "autonomous";

export interface UserResponse {
  id: number;
  full_name: string;
  email: string;
  experience_level: "beginner" | "intermediate" | "advanced";
  risk_profile: "conservative" | "moderate" | "aggressive";
  role: "user" | "admin";
  is_active: boolean;
  cash_balance: number;
  auto_trade_enabled: boolean;
  trading_mode: TradingMode;
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

export interface NewsAgentTurn {
  lean: "bullish" | "bearish" | "neutral";
  sentiment_score: number;
  reason: string;
}

export interface RiskAgentTurn {
  verdict: "proceed" | "reduce" | "veto";
  size_multiplier: number;
  reason: string;
}

export interface DebateResult {
  symbol: string;
  market_analyst: AIRecommendation;
  news: NewsAgentTurn;
  risk: RiskAgentTurn;
  final_action: "BUY" | "SELL" | "HOLD";
  final_confidence: number;
  coach_summary: string;
  generated_by: "claude" | "template";
  generated_at: string;
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
  stop_loss: number | null;
  take_profit: number | null;
  deviation: number | null;
  executed_at: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  avg_entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  stop_loss: number | null;
  take_profit: number | null;
}

export interface IndicatorSeries {
  time: string[];
  ema_20: number[];
  ema_50: number[];
  sma_20: number[];
  bollinger_upper: number[];
  bollinger_lower: number[];
  rsi: number[];
  macd: number[];
  macd_signal: number[];
}

export interface Order {
  id: number;
  symbol: string;
  side: "BUY" | "SELL";
  order_type: "limit" | "stop";
  trigger_price: number;
  quantity: number;
  stop_loss: number | null;
  take_profit: number | null;
  deviation: number | null;
  status: "open" | "filled" | "cancelled" | "expired";
  expires_at: string | null;
  created_at: string;
  filled_at: string | null;
}

export interface WatchlistItem {
  symbol: string;
  created_at: string;
}

export interface PriceAlertItem {
  id: number;
  symbol: string;
  condition: "above" | "below";
  target_price: number;
  status: "active" | "triggered" | "cancelled";
  created_at: string;
  triggered_at: string | null;
}

export interface NotificationItem {
  id: number;
  type:
    | "order_filled"
    | "sl_tp_triggered"
    | "price_alert"
    | "pending_trade_proposed"
    | "autopilot_trade";
  message: string;
  is_read: boolean;
  created_at: string;
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

export interface PendingTrade {
  id: number;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  confidence: number;
  risk_level: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "expired";
  created_at: string;
  decided_at: string | null;
}

export interface ExposureItem {
  symbol: string;
  value: number;
  pct_of_equity: number;
}

export interface PortfolioRisk {
  risk_profile: "conservative" | "moderate" | "aggressive";
  exposures: ExposureItem[];
  largest_concentration_pct: number;
  recommendations: string[];
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

export interface AdminTrade {
  id: number;
  user_email: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  realized_pnl: number | null;
  confidence: number | null;
  source: string;
  executed_at: string;
}

export interface AIEngineConfig {
  rsi_weight: number;
  macd_weight: number;
  ema_weight: number;
  bollinger_weight: number;
  sma_weight: number;
  buy_threshold: number;
  sell_threshold: number;
  autopilot_confidence_floor: number;
  autopilot_paused: boolean;
  updated_at: string;
}

export type AIEngineConfigInput = Omit<AIEngineConfig, "updated_at" | "autopilot_paused">;

export interface AutopilotStatus {
  paused: boolean;
  last_run_at: string | null;
  last_trades_placed: number;
  last_trades_proposed: number;
  last_error: string | null;
  run_interval_seconds: number;
}

export interface AdminHealth {
  status: "ok" | "degraded";
  database_ok: boolean;
  autopilot: AutopilotStatus;
}

export interface DateCount {
  date: string;
  count: number;
}

export interface SymbolVolume {
  symbol: string;
  trade_count: number;
}

export interface AdminAnalytics {
  signups_by_day: DateCount[];
  top_symbols: SymbolVolume[];
}

export interface MarketSummary {
  summary: string;
  generated_by: "claude" | "template";
  per_symbol: Record<string, string>;
}

export interface AiQueryResult {
  answer: string;
  generated_by: "claude" | "unavailable";
}

export interface NewsItem {
  id: string;
  symbol: string;
  asset_name: string;
  headline: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  impact_score: number;
  published_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
  is_read: boolean;
}
