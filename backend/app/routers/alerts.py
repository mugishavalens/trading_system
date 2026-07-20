from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..market_data import SYMBOLS
from ..models import AlertStatus, PriceAlert, User
from ..schemas import AlertResponse, CreateAlertRequest
from ..security import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertResponse])
def list_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(PriceAlert)
        .filter(PriceAlert.user_id == current_user.id, PriceAlert.status == AlertStatus.active)
        .order_by(PriceAlert.created_at.desc())
        .all()
    )


@router.post("", response_model=AlertResponse)
def create_alert(
    payload: CreateAlertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail=f"Unknown symbol: {payload.symbol}")
    alert = PriceAlert(
        user_id=current_user.id,
        symbol=payload.symbol,
        condition=payload.condition,
        target_price=payload.target_price,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}")
def cancel_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = (
        db.query(PriceAlert)
        .filter(PriceAlert.id == alert_id, PriceAlert.user_id == current_user.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = AlertStatus.cancelled
    db.commit()
    return {"status": "cancelled"}
