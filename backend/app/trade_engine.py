"""Core trade placement + AI-sizing logic.

Shared by the interactive trading endpoints (routers/trading.py) and the
autopilot background loop (autopilot.py), so "how big a trade should be"
and "how a buy/sell actually mutates cash/positions" only exist in one place.
"""

from sqlalchemy.orm import Session

from .market_data import SYMBOLS, market_store
from .models import Position, RiskProfile, Trade, TradeSide, User, UserRole
from .schemas import AIRecommendation

RISK_ALLOCATION = {
    RiskProfile.conservative: 0.05,
    RiskProfile.moderate: 0.10,
    RiskProfile.aggressive: 0.20,
}


class TradeError(Exception):
    status_code = 400


class UnknownSymbolError(TradeError):
    status_code = 404


class TradeSkipped(Exception):
    """Not an error — just nothing sensible to execute (e.g. a HOLD signal)."""


def place_trade(
    db: Session,
    user: User,
    symbol: str,
    side: TradeSide,
    quantity: float,
    source: str,
    confidence: float | None = None,
    risk_level: str | None = None,
    reason: str | None = None,
) -> Trade:
    if user.role == UserRole.admin:
        raise TradeError("Admin accounts are for platform management and cannot trade")
    if symbol not in SYMBOLS:
        raise UnknownSymbolError(f"Unknown symbol: {symbol}")
    if quantity <= 0:
        raise TradeError("Quantity must be positive")

    price = market_store.get_last_price(symbol)
    position = (
        db.query(Position)
        .filter(Position.user_id == user.id, Position.symbol == symbol)
        .first()
    )
    realized_pnl = None

    if side == TradeSide.buy:
        cost = price * quantity
        if cost > user.cash_balance:
            raise TradeError("Insufficient virtual balance for this trade")
        user.cash_balance -= cost
        if position:
            total_qty = position.quantity + quantity
            position.avg_entry_price = (
                position.avg_entry_price * position.quantity + price * quantity
            ) / total_qty
            position.quantity = total_qty
        else:
            position = Position(
                user_id=user.id, symbol=symbol, quantity=quantity, avg_entry_price=price
            )
            db.add(position)
    else:  # SELL
        if not position or position.quantity < quantity:
            raise TradeError("Insufficient position size to sell that quantity")
        realized_pnl = (price - position.avg_entry_price) * quantity
        user.cash_balance += price * quantity
        position.quantity -= quantity
        if position.quantity <= 1e-9:
            db.delete(position)

    trade = Trade(
        user_id=user.id,
        symbol=symbol,
        side=side,
        quantity=quantity,
        price=price,
        realized_pnl=realized_pnl,
        confidence=confidence,
        risk_level=risk_level,
        reason=reason,
        source=source,
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return trade


def size_ai_trade(
    db: Session, user: User, symbol: str, rec: AIRecommendation
) -> tuple[TradeSide, float]:
    """Turn an AI recommendation into a concrete (side, quantity), sized by
    the user's risk profile and the recommendation's own confidence."""
    if rec.action == "HOLD":
        raise TradeSkipped("AI is currently recommending HOLD — nothing to execute")

    allocation_pct = RISK_ALLOCATION[user.risk_profile] * (rec.confidence / 100)
    side = TradeSide.buy if rec.action == "BUY" else TradeSide.sell

    if side == TradeSide.buy:
        budget = user.cash_balance * allocation_pct
        quantity = budget / rec.price if rec.price else 0
    else:
        position = (
            db.query(Position)
            .filter(Position.user_id == user.id, Position.symbol == symbol)
            .first()
        )
        if not position:
            raise TradeSkipped("AI recommends SELL, but no position is held to sell")
        quantity = min(position.quantity, position.quantity * (allocation_pct / 0.10))

    if quantity <= 0:
        raise TradeSkipped("Computed trade size is zero")

    return side, quantity
