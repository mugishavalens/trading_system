from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..market_data import SYMBOLS
from ..models import User, WatchlistItem
from ..schemas import WatchlistAddRequest, WatchlistItemResponse
from ..security import get_current_user

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


@router.get("", response_model=list[WatchlistItemResponse])
def list_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == current_user.id)
        .order_by(WatchlistItem.created_at.asc())
        .all()
    )


@router.post("", response_model=WatchlistItemResponse)
def add_to_watchlist(
    payload: WatchlistAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail=f"Unknown symbol: {payload.symbol}")
    existing = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == current_user.id, WatchlistItem.symbol == payload.symbol)
        .first()
    )
    if existing:
        return existing
    item = WatchlistItem(user_id=current_user.id, symbol=payload.symbol)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{symbol:path}")
def remove_from_watchlist(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == current_user.id, WatchlistItem.symbol == symbol)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Symbol not in watchlist")
    db.delete(item)
    db.commit()
    return {"status": "removed"}
