import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..agents import debate
from ..ai_engine import build_recommendation
from ..database import get_db
from ..models import PendingTrade, PendingTradeStatus, Trade, User
from ..schemas import ExecuteTradeRequest, PendingTradeResponse, TradeResponse
from ..security import get_current_user
from ..trade_engine import TradeError, TradeSkipped, place_trade, size_ai_trade

router = APIRouter(prefix="/api/trading", tags=["trading"])


@router.post("/execute", response_model=TradeResponse)
def execute_trade(
    payload: ExecuteTradeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rec = build_recommendation(payload.symbol, db)
    try:
        return place_trade(
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
    except TradeError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.post("/execute-ai/{symbol:path}", response_model=TradeResponse)
def execute_ai_recommendation(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = debate.evaluate(symbol, db, current_user)
    if result.final_action == "HOLD":
        detail = (
            "AI is currently recommending HOLD — nothing to execute"
            if result.risk.verdict != "veto"
            else f"Risk Agent vetoed this trade: {result.risk.reason}"
        )
        raise HTTPException(status_code=400, detail=detail)

    rec = result.market_analyst
    try:
        side, quantity = size_ai_trade(db, current_user, symbol, rec, result.risk.size_multiplier)
        return place_trade(
            db,
            current_user,
            symbol,
            side,
            quantity,
            source="ai_auto",
            confidence=rec.confidence,
            risk_level=rec.risk_level,
            reason="; ".join(rec.reasons[:3]),
            debate_transcript=result.model_dump_json(),
        )
    except TradeSkipped as e:
        raise HTTPException(status_code=400, detail=str(e))
    except TradeError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.get("/history", response_model=list[TradeResponse])
def trade_history(
    symbol: str | None = None,
    side: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    offset: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Trade).filter(Trade.user_id == current_user.id)
    if symbol:
        query = query.filter(Trade.symbol == symbol)
    if side:
        query = query.filter(Trade.side == side)
    if date_from:
        try:
            query = query.filter(Trade.executed_at >= datetime.date.fromisoformat(date_from))
        except ValueError:
            raise HTTPException(status_code=400, detail="date_from must be YYYY-MM-DD")
    if date_to:
        try:
            end = datetime.date.fromisoformat(date_to) + datetime.timedelta(days=1)
            query = query.filter(Trade.executed_at < end)
        except ValueError:
            raise HTTPException(status_code=400, detail="date_to must be YYYY-MM-DD")
    return (
        query.order_by(Trade.executed_at.desc()).offset(offset).limit(limit).all()
    )


def _get_pending_trade(db: Session, user: User, pending_id: int) -> PendingTrade:
    pending = (
        db.query(PendingTrade)
        .filter(PendingTrade.id == pending_id, PendingTrade.user_id == user.id)
        .first()
    )
    if not pending:
        raise HTTPException(status_code=404, detail="Pending trade not found")
    if pending.status != PendingTradeStatus.pending:
        raise HTTPException(status_code=400, detail="This proposal has already been decided")
    return pending


@router.get("/pending", response_model=list[PendingTradeResponse])
def list_pending_trades(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return (
        db.query(PendingTrade)
        .filter(
            PendingTrade.user_id == current_user.id,
            PendingTrade.status == PendingTradeStatus.pending,
        )
        .order_by(PendingTrade.created_at.desc())
        .all()
    )


@router.post("/pending/{pending_id}/approve", response_model=TradeResponse)
def approve_pending_trade(
    pending_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pending = _get_pending_trade(db, current_user, pending_id)
    try:
        trade = place_trade(
            db,
            current_user,
            pending.symbol,
            pending.side,
            pending.quantity,
            source="assisted",
            confidence=pending.confidence,
            risk_level=pending.risk_level,
            reason=pending.reason,
        )
    except TradeError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    pending.status = PendingTradeStatus.approved
    pending.decided_at = datetime.datetime.utcnow()
    db.commit()
    return trade


@router.post("/pending/{pending_id}/reject", response_model=PendingTradeResponse)
def reject_pending_trade(
    pending_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pending = _get_pending_trade(db, current_user, pending_id)
    pending.status = PendingTradeStatus.rejected
    pending.decided_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(pending)
    return pending
