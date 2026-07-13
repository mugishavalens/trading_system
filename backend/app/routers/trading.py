from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..ai_engine import build_recommendation
from ..database import get_db
from ..market_data import SYMBOLS, market_store
from ..models import Position, RiskProfile, Trade, TradeSide, User
from ..schemas import ExecuteTradeRequest, TradeResponse
from ..security import get_current_user

router = APIRouter(prefix="/api/trading", tags=["trading"])

RISK_ALLOCATION = {
    RiskProfile.conservative: 0.05,
    RiskProfile.moderate: 0.10,
    RiskProfile.aggressive: 0.20,
}


def _execute(
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
    if symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail=f"Unknown symbol: {symbol}")
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")

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
            raise HTTPException(status_code=400, detail="Insufficient virtual balance for this trade")
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
            raise HTTPException(
                status_code=400, detail="Insufficient position size to sell that quantity"
            )
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


@router.post("/execute", response_model=TradeResponse)
def execute_trade(
    payload: ExecuteTradeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = build_recommendation(payload.symbol)
    trade = _execute(
        db,
        current_user,
        payload.symbol,
        payload.side,
        payload.quantity,
        source=payload.source,
        confidence=rec.confidence,
        risk_level=rec.risk_level,
        reason="; ".join(rec.reasons[:3]),
    )
    return trade


@router.post("/execute-ai/{symbol:path}", response_model=TradeResponse)
def execute_ai_recommendation(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = build_recommendation(symbol)
    if rec.action == "HOLD":
        raise HTTPException(
            status_code=400, detail="AI is currently recommending HOLD — nothing to execute"
        )

    allocation_pct = RISK_ALLOCATION[current_user.risk_profile] * (rec.confidence / 100)
    side = TradeSide.buy if rec.action == "BUY" else TradeSide.sell

    if side == TradeSide.buy:
        budget = current_user.cash_balance * allocation_pct
        quantity = budget / rec.price if rec.price else 0
    else:
        position = (
            db.query(Position)
            .filter(Position.user_id == current_user.id, Position.symbol == symbol)
            .first()
        )
        if not position:
            raise HTTPException(
                status_code=400, detail="AI recommends SELL, but you hold no position to sell"
            )
        quantity = min(position.quantity, position.quantity * (allocation_pct / 0.10))

    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Computed trade size is zero")

    trade = _execute(
        db,
        current_user,
        symbol,
        side,
        quantity,
        source="ai_auto",
        confidence=rec.confidence,
        risk_level=rec.risk_level,
        reason="; ".join(rec.reasons[:3]),
    )
    return trade


@router.get("/history", response_model=list[TradeResponse])
def trade_history(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return (
        db.query(Trade)
        .filter(Trade.user_id == current_user.id)
        .order_by(Trade.executed_at.desc())
        .limit(200)
        .all()
    )
