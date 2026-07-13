"""Background "let the AI trade for me" loop.

Runs in-process (no Celery/Redis needed for a demo of this size) as an
asyncio task started from main.py's lifespan. Every RUN_INTERVAL_SECONDS it
looks at every active, non-admin user with auto_trade_enabled set, evaluates
every symbol, and executes trades the same way the "Let AI Execute" button
does — just without a click.
"""

import asyncio
import datetime
import logging

from .ai_config_service import get_ai_config
from .ai_engine import build_recommendation
from .database import SessionLocal
from .market_data import SYMBOLS
from .models import PendingTrade, Trade, TradingMode, User, UserRole
from .trade_engine import TradeError, TradeSkipped, place_trade, size_ai_trade

logger = logging.getLogger("autopilot")

RUN_INTERVAL_SECONDS = 90
COOLDOWN = datetime.timedelta(minutes=10)


class AutopilotStatus:
    """In-memory status the admin health/AI-control endpoints read from —
    real numbers from the actual loop, not a guess."""

    def __init__(self) -> None:
        self.last_run_at: datetime.datetime | None = None
        self.last_trades_placed = 0
        self.last_trades_proposed = 0
        self.last_error: str | None = None


status = AutopilotStatus()


def _recently_auto_traded(db, user_id: int, symbol: str) -> bool:
    last = (
        db.query(Trade)
        .filter(
            Trade.user_id == user_id,
            Trade.symbol == symbol,
            Trade.source.in_(["ai_auto", "assisted"]),
        )
        .order_by(Trade.executed_at.desc())
        .first()
    )
    if last is None:
        return False
    return datetime.datetime.utcnow() - last.executed_at < COOLDOWN


def _recently_proposed(db, user_id: int, symbol: str) -> bool:
    last = (
        db.query(PendingTrade)
        .filter(PendingTrade.user_id == user_id, PendingTrade.symbol == symbol)
        .order_by(PendingTrade.created_at.desc())
        .first()
    )
    if last is None:
        return False
    return datetime.datetime.utcnow() - last.created_at < COOLDOWN


def run_autopilot_once() -> tuple[int, int]:
    """Runs one pass for every eligible user.

    Returns (trades_placed, trades_proposed)."""
    db = SessionLocal()
    trades_placed = 0
    trades_proposed = 0
    try:
        config = get_ai_config(db)
        if config.autopilot_paused:
            return 0, 0

        users = (
            db.query(User)
            .filter(
                User.role == UserRole.user,
                User.is_active.is_(True),
                User.auto_trade_enabled.is_(True),
            )
            .all()
        )

        for user in users:
            for symbol in SYMBOLS:
                try:
                    rec = build_recommendation(symbol, db)
                    if rec.confidence < config.autopilot_confidence_floor:
                        continue

                    if user.trading_mode == TradingMode.assisted:
                        if _recently_proposed(db, user.id, symbol):
                            continue
                        side, quantity = size_ai_trade(db, user, symbol, rec)
                        db.add(
                            PendingTrade(
                                user_id=user.id,
                                symbol=symbol,
                                side=side,
                                quantity=quantity,
                                confidence=rec.confidence,
                                risk_level=rec.risk_level,
                                reason="; ".join(rec.reasons[:3]),
                            )
                        )
                        db.commit()
                        trades_proposed += 1
                        logger.info(
                            "autopilot: proposed %s %s %.4f %s (confidence %.1f)",
                            user.email,
                            side.value,
                            quantity,
                            symbol,
                            rec.confidence,
                        )
                        continue

                    # autonomous
                    if _recently_auto_traded(db, user.id, symbol):
                        continue
                    side, quantity = size_ai_trade(db, user, symbol, rec)
                    place_trade(
                        db,
                        user,
                        symbol,
                        side,
                        quantity,
                        source="ai_auto",
                        confidence=rec.confidence,
                        risk_level=rec.risk_level,
                        reason="; ".join(rec.reasons[:3]),
                    )
                    trades_placed += 1
                    logger.info(
                        "autopilot: %s %s %.4f %s (confidence %.1f)",
                        user.email,
                        side.value,
                        quantity,
                        symbol,
                        rec.confidence,
                    )
                except (TradeSkipped, TradeError):
                    continue
                except Exception:
                    logger.exception(
                        "autopilot: unexpected error for user=%s symbol=%s", user.email, symbol
                    )
        return trades_placed, trades_proposed
    finally:
        db.close()


async def autopilot_loop() -> None:
    while True:
        try:
            placed, proposed = await asyncio.to_thread(run_autopilot_once)
            status.last_trades_placed = placed
            status.last_trades_proposed = proposed
            status.last_error = None
        except Exception as exc:
            status.last_error = str(exc)
            logger.exception("autopilot: run failed")
        status.last_run_at = datetime.datetime.utcnow()
        await asyncio.sleep(RUN_INTERVAL_SECONDS)
