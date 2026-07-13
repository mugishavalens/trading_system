import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..market_data import market_store
from ..models import EquitySnapshot, Position, User
from ..portfolio_service import compute_win_rate
from ..schemas import EquitySnapshotResponse, PortfolioResponse, PositionResponse
from ..security import get_current_user

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

SNAPSHOT_MIN_INTERVAL = datetime.timedelta(seconds=20)


def _maybe_record_snapshot(db: Session, user: User, equity: float) -> None:
    last = (
        db.query(EquitySnapshot)
        .filter(EquitySnapshot.user_id == user.id)
        .order_by(EquitySnapshot.recorded_at.desc())
        .first()
    )
    now = datetime.datetime.utcnow()
    if last is None or now - last.recorded_at >= SNAPSHOT_MIN_INTERVAL:
        db.add(EquitySnapshot(user_id=user.id, equity=equity, recorded_at=now))
        db.commit()


@router.get("", response_model=PortfolioResponse)
def get_portfolio(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    positions = (
        db.query(Position).filter(Position.user_id == current_user.id).all()
    )

    position_responses: list[PositionResponse] = []
    positions_value = 0.0
    high_risk_exposure = 0.0

    for pos in positions:
        current_price = market_store.get_last_price(pos.symbol)
        market_value = current_price * pos.quantity
        cost_basis = pos.avg_entry_price * pos.quantity
        unrealized_pnl = market_value - cost_basis
        unrealized_pnl_pct = (unrealized_pnl / cost_basis * 100) if cost_basis else 0.0
        positions_value += market_value
        position_responses.append(
            PositionResponse(
                symbol=pos.symbol,
                quantity=pos.quantity,
                avg_entry_price=pos.avg_entry_price,
                current_price=current_price,
                unrealized_pnl=round(unrealized_pnl, 2),
                unrealized_pnl_pct=round(unrealized_pnl_pct, 2),
            )
        )

    equity = current_user.cash_balance + positions_value
    total_pnl = equity - settings.starting_balance
    total_pnl_pct = (total_pnl / settings.starting_balance) * 100

    win_rate = compute_win_rate(db, current_user)

    concentration = (positions_value / equity) if equity else 0
    if concentration > 0.6:
        risk_score = "High"
    elif concentration > 0.3:
        risk_score = "Medium"
    else:
        risk_score = "Low"

    _maybe_record_snapshot(db, current_user, equity)

    return PortfolioResponse(
        cash_balance=round(current_user.cash_balance, 2),
        equity=round(equity, 2),
        total_pnl=round(total_pnl, 2),
        total_pnl_pct=round(total_pnl_pct, 2),
        win_rate=round(win_rate, 1),
        risk_score=risk_score,
        positions=position_responses,
    )


@router.get("/history", response_model=list[EquitySnapshotResponse])
def get_portfolio_history(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return (
        db.query(EquitySnapshot)
        .filter(EquitySnapshot.user_id == current_user.id)
        .order_by(EquitySnapshot.recorded_at.asc())
        .limit(500)
        .all()
    )
