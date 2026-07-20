"""Background loop that watches live prices against things users asked to be
watched for them: stop-loss/take-profit on open positions, limit/stop pending
orders, and price alerts. Runs far more often than the AI autopilot loop
since these need to react to a price tick, not a trading decision.

This system is spot/long-only (see trade_engine.place_trade — SELL requires
an existing position), so "stop loss" always means "price fell to X" and
"take profit" always means "price rose to X" relative to a long entry.
"""

import asyncio
import datetime
import logging

from sqlalchemy.orm import Session

from .database import SessionLocal
from .market_data import market_store
from .models import (
    AlertCondition,
    AlertStatus,
    NotificationType,
    OrderStatus,
    OrderType,
    Position,
    PendingOrder,
    PriceAlert,
    TradeSide,
    User,
)
from .notifications_service import notify
from .trade_engine import TradeError, place_trade

logger = logging.getLogger("monitor")

RUN_INTERVAL_SECONDS = 5


def _check_stop_loss_take_profit(db: Session) -> int:
    triggered = 0
    positions = db.query(Position).filter(
        (Position.stop_loss.isnot(None)) | (Position.take_profit.isnot(None))
    ).all()

    for position in positions:
        try:
            price = market_store.get_last_price(position.symbol)
        except KeyError:
            continue

        hit_sl = position.stop_loss is not None and price <= position.stop_loss
        hit_tp = position.take_profit is not None and price >= position.take_profit
        if not (hit_sl or hit_tp):
            continue

        user = db.get(User, position.user_id)
        if not user:
            continue
        quantity = position.quantity
        symbol = position.symbol
        kind = "Stop loss" if hit_sl else "Take profit"
        try:
            trade = place_trade(
                db, user, symbol, TradeSide.sell, quantity,
                source="sl_tp_auto",
                reason=f"{kind} triggered at {price}",
            )
            notify(
                db, user.id, NotificationType.sl_tp_triggered,
                f"{kind} hit on {symbol}: closed {quantity:g} @ {trade.price:g} "
                f"(P&L {trade.realized_pnl:+.2f})",
            )
            triggered += 1
        except TradeError:
            logger.exception("monitor: failed to auto-close %s for user=%s", symbol, user.id)
    return triggered


def _order_should_fill(order: PendingOrder, price: float) -> bool:
    if order.side == TradeSide.buy:
        if order.order_type == OrderType.limit:
            return price <= order.trigger_price
        return price >= order.trigger_price  # buy stop: breakout above
    else:
        if order.order_type == OrderType.limit:
            return price >= order.trigger_price
        return price <= order.trigger_price  # sell stop: breakdown below


def _check_pending_orders(db: Session) -> int:
    filled = 0
    now = datetime.datetime.utcnow()
    orders = db.query(PendingOrder).filter(PendingOrder.status == OrderStatus.open).all()

    for order in orders:
        if order.expires_at is not None and now >= order.expires_at:
            order.status = OrderStatus.expired
            db.commit()
            notify(
                db, order.user_id, NotificationType.order_filled,
                f"{order.order_type.value.title()} order for {order.symbol} expired unfilled",
            )
            continue

        try:
            price = market_store.get_last_price(order.symbol)
        except KeyError:
            continue

        if not _order_should_fill(order, price):
            continue

        user = db.get(User, order.user_id)
        if not user:
            continue

        # A sell order can never fill if the position it was meant to close
        # is already gone (e.g. closed by SL/TP first) — cancel, don't retry forever.
        if order.side == TradeSide.sell:
            position = (
                db.query(Position)
                .filter(Position.user_id == user.id, Position.symbol == order.symbol)
                .first()
            )
            if not position or position.quantity < order.quantity:
                order.status = OrderStatus.cancelled
                db.commit()
                notify(
                    db, user.id, NotificationType.order_filled,
                    f"Sell {order.order_type.value} order for {order.symbol} cancelled — "
                    "position no longer large enough",
                )
                continue

        try:
            trade = place_trade(
                db, user, order.symbol, order.side, order.quantity,
                source=f"{order.order_type.value}_order",
                stop_loss=order.stop_loss,
                take_profit=order.take_profit,
                deviation=order.deviation,
                reference_price=order.trigger_price,
            )
            order.status = OrderStatus.filled
            order.filled_at = now
            db.commit()
            notify(
                db, user.id, NotificationType.order_filled,
                f"{order.order_type.value.title()} order filled: {order.side.value} "
                f"{order.quantity:g} {order.symbol} @ {trade.price:g}",
            )
            filled += 1
        except TradeError:
            # Most commonly insufficient cash for a buy — leave it open to retry.
            continue
    return filled


def _check_price_alerts(db: Session) -> int:
    triggered = 0
    alerts = db.query(PriceAlert).filter(PriceAlert.status == AlertStatus.active).all()
    for alert in alerts:
        try:
            price = market_store.get_last_price(alert.symbol)
        except KeyError:
            continue

        hit = (
            price >= alert.target_price
            if alert.condition == AlertCondition.above
            else price <= alert.target_price
        )
        if not hit:
            continue

        alert.status = AlertStatus.triggered
        alert.triggered_at = datetime.datetime.utcnow()
        db.commit()
        notify(
            db, alert.user_id, NotificationType.price_alert,
            f"{alert.symbol} is now {alert.condition.value} {alert.target_price:g} "
            f"(currently {price:g})",
        )
        triggered += 1
    return triggered


def run_monitor_once() -> tuple[int, int, int]:
    db = SessionLocal()
    try:
        sl_tp = _check_stop_loss_take_profit(db)
        orders = _check_pending_orders(db)
        alerts = _check_price_alerts(db)
        return sl_tp, orders, alerts
    finally:
        db.close()


async def monitor_loop() -> None:
    while True:
        try:
            await asyncio.to_thread(run_monitor_once)
        except Exception:
            logger.exception("monitor: run failed")
        await asyncio.sleep(RUN_INTERVAL_SECONDS)
