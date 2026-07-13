import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Trade, User, UserRole
from ..portfolio_service import compute_equity
from ..schemas import (
    AdminStatsResponse,
    AdminUserResponse,
    AIPerformanceResponse,
    SymbolPerformance,
)
from ..security import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(
    db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for user in users:
        trade_count = db.query(Trade).filter(Trade.user_id == user.id).count()
        result.append(
            AdminUserResponse(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                experience_level=user.experience_level,
                risk_profile=user.risk_profile,
                role=user.role,
                is_active=user.is_active,
                cash_balance=round(user.cash_balance, 2),
                created_at=user.created_at,
                trade_count=trade_count,
                equity=round(compute_equity(db, user), 2),
            )
        )
    return result


def _get_target_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/users/{user_id}/suspend", response_model=AdminUserResponse)
def toggle_suspend(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    user = _get_target_user(db, user_id)
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot suspend your own account")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    trade_count = db.query(Trade).filter(Trade.user_id == user.id).count()
    return AdminUserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        experience_level=user.experience_level,
        risk_profile=user.risk_profile,
        role=user.role,
        is_active=user.is_active,
        cash_balance=round(user.cash_balance, 2),
        created_at=user.created_at,
        trade_count=trade_count,
        equity=round(compute_equity(db, user), 2),
    )


@router.post("/users/{user_id}/promote", response_model=AdminUserResponse)
def promote_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    user = _get_target_user(db, user_id)
    user.role = UserRole.admin
    db.commit()
    db.refresh(user)
    trade_count = db.query(Trade).filter(Trade.user_id == user.id).count()
    return AdminUserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        experience_level=user.experience_level,
        risk_profile=user.risk_profile,
        role=user.role,
        is_active=user.is_active,
        cash_balance=round(user.cash_balance, 2),
        created_at=user.created_at,
        trade_count=trade_count,
        equity=round(compute_equity(db, user), 2),
    )


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    user = _get_target_user(db, user_id)
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    db.delete(user)
    db.commit()
    return {"status": "deleted"}


@router.get("/stats", response_model=AdminStatsResponse)
def get_stats(
    db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)
):
    users = db.query(User).all()
    all_trades = db.query(Trade).all()

    today = datetime.datetime.utcnow().date()
    trades_today = sum(1 for t in all_trades if t.executed_at.date() == today)
    ai_auto_trades = sum(1 for t in all_trades if t.source == "ai_auto")
    manual_trades = len(all_trades) - ai_auto_trades

    confidences = [t.confidence for t in all_trades if t.confidence is not None]
    average_confidence = sum(confidences) / len(confidences) if confidences else 0.0

    experience_breakdown: dict[str, int] = {}
    risk_breakdown: dict[str, int] = {}
    for u in users:
        experience_breakdown[u.experience_level.value] = (
            experience_breakdown.get(u.experience_level.value, 0) + 1
        )
        risk_breakdown[u.risk_profile.value] = risk_breakdown.get(u.risk_profile.value, 0) + 1

    return AdminStatsResponse(
        total_users=len(users),
        active_users=sum(1 for u in users if u.is_active),
        admin_users=sum(1 for u in users if u.role == UserRole.admin),
        total_trades=len(all_trades),
        trades_today=trades_today,
        ai_auto_trades=ai_auto_trades,
        manual_trades=manual_trades,
        average_ai_confidence=round(average_confidence, 1),
        experience_breakdown=experience_breakdown,
        risk_profile_breakdown=risk_breakdown,
    )


@router.get("/ai-performance", response_model=AIPerformanceResponse)
def get_ai_performance(
    db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)
):
    all_trades = db.query(Trade).all()

    confidences = [t.confidence for t in all_trades if t.confidence is not None]
    average_confidence = sum(confidences) / len(confidences) if confidences else 0.0

    action_distribution = {"BUY": 0, "SELL": 0}
    for t in all_trades:
        action_distribution[t.side.value] = action_distribution.get(t.side.value, 0) + 1

    by_symbol_map: dict[str, list[Trade]] = {}
    for t in all_trades:
        by_symbol_map.setdefault(t.symbol, []).append(t)

    by_symbol: list[SymbolPerformance] = []
    for symbol, trades in by_symbol_map.items():
        closed = [t for t in trades if t.realized_pnl is not None]
        wins = sum(1 for t in closed if t.realized_pnl and t.realized_pnl > 0)
        win_rate = (wins / len(closed) * 100) if closed else 0.0
        total_pnl = sum(t.realized_pnl or 0 for t in closed)
        by_symbol.append(
            SymbolPerformance(
                symbol=symbol,
                trade_count=len(trades),
                total_realized_pnl=round(total_pnl, 2),
                win_rate=round(win_rate, 1),
            )
        )

    ranked = sorted(by_symbol, key=lambda s: s.total_realized_pnl, reverse=True)
    best_symbol = ranked[0] if ranked else None
    worst_symbol = ranked[-1] if len(ranked) > 1 else None

    closed_all = [t for t in all_trades if t.realized_pnl is not None]
    overall_wins = sum(1 for t in closed_all if t.realized_pnl and t.realized_pnl > 0)
    overall_win_rate = (overall_wins / len(closed_all) * 100) if closed_all else 0.0

    return AIPerformanceResponse(
        overall_win_rate=round(overall_win_rate, 1),
        average_confidence=round(average_confidence, 1),
        action_distribution=action_distribution,
        best_symbol=best_symbol,
        worst_symbol=worst_symbol,
        by_symbol=by_symbol,
    )
