import datetime
import enum

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class ExperienceLevel(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"


class RiskProfile(str, enum.Enum):
    conservative = "conservative"
    moderate = "moderate"
    aggressive = "aggressive"


class TradeSide(str, enum.Enum):
    buy = "BUY"
    sell = "SELL"


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class TradingMode(str, enum.Enum):
    manual = "manual"  # AI only ever suggests; user places every trade themselves
    assisted = "assisted"  # autopilot proposes trades that the user approves/rejects
    autonomous = "autonomous"  # autopilot executes directly, today's original behavior


class PendingTradeStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    expired = "expired"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    experience_level: Mapped[ExperienceLevel] = mapped_column(
        Enum(ExperienceLevel), default=ExperienceLevel.beginner
    )
    risk_profile: Mapped[RiskProfile] = mapped_column(
        Enum(RiskProfile), default=RiskProfile.moderate
    )
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.user)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    cash_balance: Mapped[float] = mapped_column(Float, default=100_000.0)
    auto_trade_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    trading_mode: Mapped[TradingMode] = mapped_column(
        Enum(TradingMode), default=TradingMode.manual
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    positions: Mapped[list["Position"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    trades: Mapped[list["Trade"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    equity_snapshots: Mapped[list["EquitySnapshot"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    pending_trades: Mapped[list["PendingTrade"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Position(Base):
    __tablename__ = "positions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    symbol: Mapped[str] = mapped_column(String(20), index=True)
    quantity: Mapped[float] = mapped_column(Float)
    avg_entry_price: Mapped[float] = mapped_column(Float)
    opened_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    user: Mapped["User"] = relationship(back_populates="positions")


class Trade(Base):
    __tablename__ = "trades"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    symbol: Mapped[str] = mapped_column(String(20), index=True)
    side: Mapped[TradeSide] = mapped_column(Enum(TradeSide))
    quantity: Mapped[float] = mapped_column(Float)
    price: Mapped[float] = mapped_column(Float)
    realized_pnl: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str] = mapped_column(String(20), default="manual")  # manual | ai_auto
    debate_transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    executed_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    user: Mapped["User"] = relationship(back_populates="trades")


class EquitySnapshot(Base):
    __tablename__ = "equity_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    equity: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, index=True
    )

    user: Mapped["User"] = relationship(back_populates="equity_snapshots")


class AIEngineConfig(Base):
    """Singleton row (id=1) holding the tunable weights behind ai_engine.py.

    Lets an admin adjust how much each indicator contributes to a
    recommendation without a code deploy — the closest thing this rule-based
    engine has to "retraining"."""

    __tablename__ = "ai_engine_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    rsi_weight: Mapped[float] = mapped_column(Float, default=0.25)
    macd_weight: Mapped[float] = mapped_column(Float, default=0.25)
    ema_weight: Mapped[float] = mapped_column(Float, default=0.25)
    bollinger_weight: Mapped[float] = mapped_column(Float, default=0.15)
    sma_weight: Mapped[float] = mapped_column(Float, default=0.10)
    buy_threshold: Mapped[float] = mapped_column(Float, default=0.15)
    sell_threshold: Mapped[float] = mapped_column(Float, default=-0.15)
    autopilot_confidence_floor: Mapped[float] = mapped_column(Float, default=65.0)
    autopilot_paused: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )


class PendingTrade(Base):
    """A trade the autopilot loop proposed for a user in `assisted` mode but
    hasn't executed yet — the user must approve or reject it (see
    trade_engine.place_trade for the actual execution path, reused on approve)."""

    __tablename__ = "pending_trades"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    symbol: Mapped[str] = mapped_column(String(20), index=True)
    side: Mapped[TradeSide] = mapped_column(Enum(TradeSide))
    quantity: Mapped[float] = mapped_column(Float)
    confidence: Mapped[float] = mapped_column(Float)
    risk_level: Mapped[str] = mapped_column(String(20))
    reason: Mapped[str] = mapped_column(Text)
    debate_transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[PendingTradeStatus] = mapped_column(
        Enum(PendingTradeStatus), default=PendingTradeStatus.pending
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, index=True
    )
    decided_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="pending_trades")


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, index=True
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
