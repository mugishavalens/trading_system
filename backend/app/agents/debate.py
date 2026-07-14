"""Orchestrates the four-agent debate: Market Analyst -> News -> Risk (the
hard gate) -> Coach. This is what execute-ai and autopilot call instead of
ai_engine.build_recommendation directly, so AI-controlled money always goes
through the Risk Agent's veto/reduce logic.
"""

import datetime

from sqlalchemy.orm import Session

from ..models import User
from ..portfolio_service import compute_exposures
from ..schemas import DebateResult
from . import coach, market_analyst, news_agent, risk_agent


def evaluate(symbol: str, db: Session, user: User) -> DebateResult:
    rec = market_analyst.evaluate(symbol, db)
    news = news_agent.evaluate(symbol)
    exposures = compute_exposures(db, user)
    risk = risk_agent.evaluate(rec, news, user, exposures)

    final_action = "HOLD" if risk.verdict == "veto" else rec.action
    # The analyst's own confidence is preserved even on veto/reduce, so the UI
    # can show "the analyst wanted this, risk overrode it" rather than losing
    # that context.
    final_confidence = rec.confidence

    coach_summary, generated_by = coach.summarize(rec, news, risk, final_action, final_confidence)

    return DebateResult(
        symbol=symbol,
        market_analyst=rec,
        news=news,
        risk=risk,
        final_action=final_action,
        final_confidence=final_confidence,
        coach_summary=coach_summary,
        generated_by=generated_by,
        generated_at=datetime.datetime.utcnow(),
    )
