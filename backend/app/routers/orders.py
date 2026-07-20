import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..market_data import SYMBOLS
from ..models import OrderStatus, PendingOrder, User, UserRole
from ..schemas import CreateOrderRequest, OrderResponse
from ..security import get_current_user

router = APIRouter(prefix="/api/trading/orders", tags=["orders"])


@router.post("", response_model=OrderResponse)
def create_order(
    payload: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin accounts cannot trade")
    if payload.symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail=f"Unknown symbol: {payload.symbol}")

    expires_at = None
    if payload.expires_in_hours:
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=payload.expires_in_hours)

    order = PendingOrder(
        user_id=current_user.id,
        symbol=payload.symbol,
        side=payload.side,
        order_type=payload.order_type,
        trigger_price=payload.trigger_price,
        quantity=payload.quantity,
        stop_loss=payload.stop_loss,
        take_profit=payload.take_profit,
        deviation=payload.deviation,
        expires_at=expires_at,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[OrderResponse])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(PendingOrder)
        .filter(PendingOrder.user_id == current_user.id, PendingOrder.status == OrderStatus.open)
        .order_by(PendingOrder.created_at.desc())
        .all()
    )


@router.delete("/{order_id}", response_model=OrderResponse)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = (
        db.query(PendingOrder)
        .filter(PendingOrder.id == order_id, PendingOrder.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != OrderStatus.open:
        raise HTTPException(status_code=400, detail="Order is no longer open")
    order.status = OrderStatus.cancelled
    db.commit()
    db.refresh(order)
    return order
