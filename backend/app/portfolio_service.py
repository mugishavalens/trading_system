"""Shared portfolio math used by both the user-facing portfolio router and
the admin router, so equity/win-rate aren't computed two different ways."""

from sqlalchemy.orm import Session

from .market_data import market_store
from .models import Position, Trade, User
from .schemas import ExposureItem

CONCENTRATION_WARNING_PCT = 30.0
CONCENTRATION_TARGET_PCT = 20.0


def compute_positions_value(db: Session, user: User) -> float:
    positions = db.query(Position).filter(Position.user_id == user.id).all()
    return sum(
        market_store.get_last_price(pos.symbol) * pos.quantity for pos in positions
    )


def compute_equity(db: Session, user: User) -> float:
    return user.cash_balance + compute_positions_value(db, user)


def compute_win_rate(db: Session, user: User) -> float:
    closed_trades = (
        db.query(Trade)
        .filter(Trade.user_id == user.id, Trade.realized_pnl.isnot(None))
        .all()
    )
    if not closed_trades:
        return 0.0
    wins = sum(1 for t in closed_trades if t.realized_pnl and t.realized_pnl > 0)
    return wins / len(closed_trades) * 100


def compute_exposures(db: Session, user: User) -> list[ExposureItem]:
    """Per-symbol position value as a % of equity, largest first — shared by
    the /portfolio/risk endpoint and the Risk Agent's concentration check."""
    positions = db.query(Position).filter(Position.user_id == user.id).all()
    values = {
        pos.symbol: market_store.get_last_price(pos.symbol) * pos.quantity
        for pos in positions
    }
    equity = user.cash_balance + sum(values.values())

    exposures = [
        ExposureItem(
            symbol=symbol,
            value=round(value, 2),
            pct_of_equity=round((value / equity * 100) if equity else 0, 1),
        )
        for symbol, value in values.items()
    ]
    exposures.sort(key=lambda e: e.pct_of_equity, reverse=True)
    return exposures
