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
    debate_transcript: str | None = None,
    stop_loss: float | None = None,
    take_profit: float | None = None,
    deviation: float | None = None,
    reference_price: float | None = None,
) -> Trade:
    if user.role == UserRole.admin:
        raise TradeError("Admin accounts are for platform management and cannot trade")
    if symbol not in SYMBOLS:
        raise UnknownSymbolError(f"Unknown symbol: {symbol}")
    if quantity <= 0:
        raise TradeError("Quantity must be positive")

    price = market_store.get_last_price(symbol)

    # Deviation = max allowed slippage between the price the user last saw
    # (reference_price, sent by the frontend at click time) and the price
    # this fills at. Mirrors MT5's "Deviation" field on a market order.
    if deviation is not None and reference_price is not None:
        if abs(price - reference_price) > deviation:
            raise TradeError(
                f"Price moved beyond your {deviation} deviation tolerance "
                f"(quoted {reference_price}, now {price}) — trade rejected"
            )

    if side == TradeSide.buy and stop_loss is not None and stop_loss >= price:
        raise TradeError("Stop loss must be below the current price for a BUY")
    if side == TradeSide.buy and take_profit is not None and take_profit <= price:
        raise TradeError("Take profit must be above the current price for a BUY")

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
            # A fresh SL/TP on an add-to-position order replaces the old one —
            # there's only one stop/target per symbol in this simplified model.
            if stop_loss is not None:
                position.stop_loss = stop_loss
            if take_profit is not None:
                position.take_profit = take_profit
        else:
            position = Position(
                user_id=user.id,
                symbol=symbol,
                quantity=quantity,
                avg_entry_price=price,
                stop_loss=stop_loss,
                take_profit=take_profit,
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
        stop_loss=stop_loss,
        take_profit=take_profit,
        deviation=deviation,
        debate_transcript=debate_transcript,
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return trade


def size_ai_trade(
    db: Session, user: User, symbol: str, rec: AIRecommendation, size_multiplier: float = 1.0
) -> tuple[TradeSide, float]:
    """Turn an AI recommendation into a concrete (side, quantity), sized by
    the user's risk profile and the recommendation's own confidence.

    size_multiplier comes from the Risk Agent's verdict (1.0 proceed, 0.5
    reduce, 0.0 veto — though a veto should already have been turned into a
    HOLD by the debate orchestrator before this is called)."""
    if rec.action == "HOLD":
        raise TradeSkipped("AI is currently recommending HOLD — nothing to execute")

    allocation_pct = RISK_ALLOCATION[user.risk_profile] * (rec.confidence / 100) * size_multiplier
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
