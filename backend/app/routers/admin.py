import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .. import autopilot
from ..ai_config_service import get_ai_config
from ..ai_engine import build_recommendation
from ..config import settings
from ..database import get_db
from ..market_data import SYMBOLS
from ..models import ContactMessage, Trade, User, UserRole
from ..portfolio_service import compute_equity
from ..schemas import (
    AdminAnalyticsResponse,
    AdminHealthResponse,
    AdminStatsResponse,
    AdminTradeResponse,
    AdminUserResponse,
    AIEngineConfigResponse,
    AIEngineConfigUpdateRequest,
    AiQueryRequest,
    AiQueryResponse,
    AIPerformanceResponse,
    AutopilotStatusResponse,
    ContactMessageResponse,
    DateCount,
    MarketSummaryResponse,
    SymbolPerformance,
    SymbolVolume,
)
from ..security import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _to_admin_user_response(db: Session, user: User) -> AdminUserResponse:
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


def _get_target_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(
    search: str | None = None,
    role: str | None = None,
    status: str | None = None,  # "active" | "suspended"
    offset: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    query = db.query(User)
    if search:
        like = f"%{search}%"
        query = query.filter((User.full_name.ilike(like)) | (User.email.ilike(like)))
    if role:
        query = query.filter(User.role == role)
    if status == "active":
        query = query.filter(User.is_active.is_(True))
    elif status == "suspended":
        query = query.filter(User.is_active.is_(False))
    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return [_to_admin_user_response(db, u) for u in users]


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
    return _to_admin_user_response(db, user)


@router.post("/users/{user_id}/promote", response_model=AdminUserResponse)
def promote_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    user = _get_target_user(db, user_id)
    user.role = UserRole.admin
    user.auto_trade_enabled = False  # admins don't trade
    db.commit()
    db.refresh(user)
    return _to_admin_user_response(db, user)


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


@router.get("/activity", response_model=list[AdminTradeResponse])
def get_activity(
    symbol: str | None = None,
    side: str | None = None,
    source: str | None = None,
    user: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    offset: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    query = db.query(Trade, User.email).join(User, Trade.user_id == User.id)
    if symbol:
        query = query.filter(Trade.symbol == symbol)
    if side:
        query = query.filter(Trade.side == side)
    if source:
        query = query.filter(Trade.source == source)
    if user:
        query = query.filter(User.email.ilike(f"%{user}%"))
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
    trades = (
        query.order_by(Trade.executed_at.desc()).offset(offset).limit(limit).all()
    )
    return [
        AdminTradeResponse(
            id=trade.id,
            user_email=email,
            symbol=trade.symbol,
            side=trade.side,
            quantity=trade.quantity,
            price=trade.price,
            realized_pnl=trade.realized_pnl,
            confidence=trade.confidence,
            source=trade.source,
            executed_at=trade.executed_at,
        )
        for trade, email in trades
    ]


@router.get("/ai-config", response_model=AIEngineConfigResponse)
def get_ai_engine_config(
    db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)
):
    return get_ai_config(db)


@router.put("/ai-config", response_model=AIEngineConfigResponse)
def update_ai_engine_config(
    payload: AIEngineConfigUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    config = get_ai_config(db)
    for field, value in payload.model_dump().items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return config


@router.post("/ai-config/reset", response_model=AIEngineConfigResponse)
def reset_ai_engine_config(
    db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)
):
    config = get_ai_config(db)
    defaults = {
        "rsi_weight": 0.25,
        "macd_weight": 0.25,
        "ema_weight": 0.25,
        "bollinger_weight": 0.15,
        "sma_weight": 0.10,
        "buy_threshold": 0.15,
        "sell_threshold": -0.15,
        "autopilot_confidence_floor": 65.0,
    }
    for field, value in defaults.items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return config


@router.post("/ai-config/pause", response_model=AIEngineConfigResponse)
def pause_autopilot(
    db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)
):
    config = get_ai_config(db)
    config.autopilot_paused = True
    db.commit()
    db.refresh(config)
    return config


@router.post("/ai-config/resume", response_model=AIEngineConfigResponse)
def resume_autopilot(
    db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)
):
    config = get_ai_config(db)
    config.autopilot_paused = False
    db.commit()
    db.refresh(config)
    return config


@router.get("/health", response_model=AdminHealthResponse)
def get_health(
    db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)
):
    try:
        db.execute(text("SELECT 1"))
        database_ok = True
    except Exception:
        database_ok = False

    config = get_ai_config(db)
    autopilot_status = AutopilotStatusResponse(
        paused=config.autopilot_paused,
        last_run_at=autopilot.status.last_run_at,
        last_trades_placed=autopilot.status.last_trades_placed,
        last_trades_proposed=autopilot.status.last_trades_proposed,
        last_error=autopilot.status.last_error,
        run_interval_seconds=autopilot.RUN_INTERVAL_SECONDS,
    )
    overall = "ok" if database_ok and autopilot.status.last_error is None else "degraded"
    return AdminHealthResponse(status=overall, database_ok=database_ok, autopilot=autopilot_status)


@router.get("/analytics", response_model=AdminAnalyticsResponse)
def get_analytics(
    date_from: str | None = None,
    date_to: str | None = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    users = db.query(User).all()
    signup_counts: dict[str, int] = {}
    for u in users:
        day = u.created_at.date().isoformat()
        signup_counts[day] = signup_counts.get(day, 0) + 1
    signups_by_day = [
        DateCount(date=day, count=count) for day, count in sorted(signup_counts.items())
    ]

    trades_query = db.query(Trade)
    if date_from:
        try:
            trades_query = trades_query.filter(
                Trade.executed_at >= datetime.date.fromisoformat(date_from)
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="date_from must be YYYY-MM-DD")
    if date_to:
        try:
            end = datetime.date.fromisoformat(date_to) + datetime.timedelta(days=1)
            trades_query = trades_query.filter(Trade.executed_at < end)
        except ValueError:
            raise HTTPException(status_code=400, detail="date_to must be YYYY-MM-DD")

    symbol_counts: dict[str, int] = {}
    for t in trades_query.all():
        symbol_counts[t.symbol] = symbol_counts.get(t.symbol, 0) + 1
    top_symbols = sorted(
        (SymbolVolume(symbol=s, trade_count=c) for s, c in symbol_counts.items()),
        key=lambda x: x.trade_count,
        reverse=True,
    )
    return AdminAnalyticsResponse(signups_by_day=signups_by_day, top_symbols=top_symbols)


MARKET_SUMMARY_SYSTEM_PROMPT = """You are an AI market analyst inside a DEMO paper-trading \
platform's admin dashboard. You'll be given the current rule-based technical signal \
(BUY/SELL/HOLD, confidence, risk) for each tracked symbol. Rules:
- Write ONE short paragraph (3-4 sentences) summarizing overall conditions in plain language \
for a platform admin.
- Never claim certainty about future price moves.
- End with a brief reminder these are demo, rule-based signals, not financial advice."""


def _template_market_summary(recs: list) -> str:
    bullish = sum(1 for r in recs if r.action == "BUY")
    bearish = sum(1 for r in recs if r.action == "SELL")
    neutral = len(recs) - bullish - bearish
    lean = "bullish" if bullish > bearish else "bearish" if bearish > bullish else "mixed"
    return (
        f"Across the {len(recs)} tracked symbols, the engine currently reads {bullish} bullish, "
        f"{bearish} bearish, and {neutral} neutral signal(s) — overall conditions look {lean}. "
        "This is a demo, rule-based signal summary, not financial advice — markets are uncertain."
    )


@router.get("/market-summary", response_model=MarketSummaryResponse)
def get_market_summary(
    db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)
):
    recs = [build_recommendation(symbol, db) for symbol in SYMBOLS]
    per_symbol = {r.symbol: r.action for r in recs}

    if not settings.anthropic_api_key:
        return MarketSummaryResponse(
            summary=_template_market_summary(recs), generated_by="template", per_symbol=per_symbol
        )

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        lines = [
            f"{r.symbol}: {r.action}, confidence {r.confidence:.0f}%, risk {r.risk_level}"
            for r in recs
        ]
        response = client.messages.create(
            model="claude-sonnet-5",
            max_tokens=300,
            system=MARKET_SUMMARY_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": "\n".join(lines)}],
        )
        text_out = "".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        )
        return MarketSummaryResponse(
            summary=text_out.strip(), generated_by="claude", per_symbol=per_symbol
        )
    except Exception:
        return MarketSummaryResponse(
            summary=_template_market_summary(recs), generated_by="template", per_symbol=per_symbol
        )


AI_QUERY_SYSTEM_PROMPT = """You are an AI operations analyst embedded in a DEMO paper-trading \
platform's admin dashboard (the "AI Command Center"). You'll be given a snapshot of current \
platform stats, AI performance, and recent trade activity as context, followed by an admin's \
question. Rules:
- Answer using ONLY the provided data — if it doesn't answer the question, say so plainly \
rather than guessing or inventing numbers.
- Keep answers concise and analytical.
- This is a demo platform; never present the figures as real financial/production data."""


@router.post("/ai-query", response_model=AiQueryResponse)
def ai_query(
    payload: AiQueryRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    if not settings.anthropic_api_key:
        return AiQueryResponse(
            answer=(
                "The AI Command Center needs an ANTHROPIC_API_KEY configured on the server "
                "to answer free-form questions."
            ),
            generated_by="unavailable",
        )

    stats = get_stats(db=db, current_admin=current_admin)
    perf = get_ai_performance(db=db, current_admin=current_admin)
    recent = get_activity(db=db, current_admin=current_admin, limit=30)

    context = (
        f"Platform stats: {stats.model_dump()}\n"
        f"AI performance: {perf.model_dump()}\n"
        f"Most recent trades (up to 30): {[t.model_dump() for t in recent]}\n"
    )

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-5",
            max_tokens=500,
            system=AI_QUERY_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"{context}\nQuestion: {payload.question}"}],
        )
        text_out = "".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        )
        return AiQueryResponse(answer=text_out.strip(), generated_by="claude")
    except Exception:
        return AiQueryResponse(
            answer="Couldn't reach the AI model right now — please try again shortly.",
            generated_by="unavailable",
        )


@router.get("/messages", response_model=list[ContactMessageResponse])
def list_messages(
    db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)
):
    return (
        db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()
    )


@router.post("/messages/{message_id}/read", response_model=ContactMessageResponse)
def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    message = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    message.is_read = True
    db.commit()
    db.refresh(message)
    return message


@router.delete("/messages/{message_id}")
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    message = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(message)
    db.commit()
    return {"status": "deleted"}
