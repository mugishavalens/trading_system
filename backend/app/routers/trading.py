from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..ai_engine import build_recommendation
from ..database import get_db
from ..models import Trade, User
from ..schemas import ExecuteTradeRequest, TradeResponse
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
    rec = build_recommendation(symbol, db)
    try:
        side, quantity = size_ai_trade(db, current_user, symbol, rec)
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
        )
    except TradeSkipped as e:
        raise HTTPException(status_code=400, detail=str(e))
    except TradeError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


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
