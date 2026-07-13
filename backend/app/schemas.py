import datetime

from pydantic import BaseModel, EmailStr, Field

from .models import ExperienceLevel, RiskProfile, TradeSide, UserRole


# ---- Auth ----

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=6)
    experience_level: ExperienceLevel = ExperienceLevel.beginner
    risk_profile: RiskProfile = RiskProfile.moderate


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    experience_level: ExperienceLevel
    risk_profile: RiskProfile
    role: UserRole
    is_active: bool
    cash_balance: float
    auto_trade_enabled: bool

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    experience_level: ExperienceLevel | None = None
    risk_profile: RiskProfile | None = None
    auto_trade_enabled: bool | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


# ---- Market data ----

class Candle(BaseModel):
    time: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class SymbolInfo(BaseModel):
    symbol: str
    name: str
    asset_class: str
    last_price: float
    change_pct_24h: float


# ---- AI decisions ----

class IndicatorSnapshot(BaseModel):
    rsi: float
    macd: float
    macd_signal: float
    ema_20: float
    ema_50: float
    sma_20: float
    bollinger_upper: float
    bollinger_lower: float
    atr: float


class AIRecommendation(BaseModel):
    symbol: str
    action: str  # BUY | SELL | HOLD
    confidence: float
    risk_level: str
    expected_return_pct: float
    reasons: list[str]
    indicators: IndicatorSnapshot
    price: float
    generated_at: datetime.datetime
    disclaimer: str = (
        "This is an automated, demo-only signal based on historical technical "
        "indicators. It is not financial advice, and markets are inherently "
        "uncertain — past patterns do not guarantee future results."
    )


class ExplainRequest(BaseModel):
    symbol: str


class ExplainResponse(BaseModel):
    symbol: str
    explanation: str
    generated_by: str  # "claude" | "template"


# ---- Trading ----

class ExecuteTradeRequest(BaseModel):
    symbol: str
    side: TradeSide
    quantity: float = Field(gt=0)
    source: str = "manual"


class TradeResponse(BaseModel):
    id: int
    symbol: str
    side: TradeSide
    quantity: float
    price: float
    realized_pnl: float | None
    confidence: float | None
    risk_level: str | None
    reason: str | None
    source: str
    executed_at: datetime.datetime

    class Config:
        from_attributes = True


class PositionResponse(BaseModel):
    symbol: str
    quantity: float
    avg_entry_price: float
    current_price: float
    unrealized_pnl: float
    unrealized_pnl_pct: float


class PortfolioResponse(BaseModel):
    cash_balance: float
    equity: float
    total_pnl: float
    total_pnl_pct: float
    win_rate: float
    risk_score: str
    positions: list[PositionResponse]


class EquitySnapshotResponse(BaseModel):
    equity: float
    recorded_at: datetime.datetime

    class Config:
        from_attributes = True


# ---- AI Assistant ----

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: str
    generated_by: str  # "claude" | "faq"


# ---- Admin ----

class AdminUserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    experience_level: ExperienceLevel
    risk_profile: RiskProfile
    role: UserRole
    is_active: bool
    cash_balance: float
    created_at: datetime.datetime
    trade_count: int
    equity: float

    class Config:
        from_attributes = True


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    admin_users: int
    total_trades: int
    trades_today: int
    ai_auto_trades: int
    manual_trades: int
    average_ai_confidence: float
    experience_breakdown: dict[str, int]
    risk_profile_breakdown: dict[str, int]


class SymbolPerformance(BaseModel):
    symbol: str
    trade_count: int
    total_realized_pnl: float
    win_rate: float


class AIPerformanceResponse(BaseModel):
    overall_win_rate: float
    average_confidence: float
    action_distribution: dict[str, int]
    best_symbol: SymbolPerformance | None
    worst_symbol: SymbolPerformance | None
    by_symbol: list[SymbolPerformance]


class AdminTradeResponse(BaseModel):
    id: int
    user_email: str
    symbol: str
    side: TradeSide
    quantity: float
    price: float
    realized_pnl: float | None
    confidence: float | None
    source: str
    executed_at: datetime.datetime


class AIEngineConfigResponse(BaseModel):
    rsi_weight: float
    macd_weight: float
    ema_weight: float
    bollinger_weight: float
    sma_weight: float
    buy_threshold: float
    sell_threshold: float
    autopilot_confidence_floor: float
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class AIEngineConfigUpdateRequest(BaseModel):
    rsi_weight: float = Field(ge=0, le=1)
    macd_weight: float = Field(ge=0, le=1)
    ema_weight: float = Field(ge=0, le=1)
    bollinger_weight: float = Field(ge=0, le=1)
    sma_weight: float = Field(ge=0, le=1)
    buy_threshold: float = Field(ge=0, le=1)
    sell_threshold: float = Field(ge=-1, le=0)
    autopilot_confidence_floor: float = Field(ge=50, le=100)


# ---- News ----

class NewsItemResponse(BaseModel):
    id: str
    symbol: str
    headline: str
    summary: str
    sentiment: str  # "positive" | "negative" | "neutral"
    impact_score: int  # 1-10
    published_at: datetime.datetime


# ---- Contact ----

class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    message: str = Field(min_length=1, max_length=5000)


class ContactMessageResponse(BaseModel):
    id: int
    name: str
    email: str
    message: str
    created_at: datetime.datetime
    is_read: bool

    class Config:
        from_attributes = True
