"""The "Risk Agent" — the one agent with veto power.

Deliberately a pure function: no DB queries inside. The caller fetches
exposures/user once and passes them in, which is also what makes this the
one piece of the debate that's cheaply unit-testable without a DB fixture.
"""

from ..models import RiskProfile, User
from ..portfolio_service import CONCENTRATION_WARNING_PCT
from ..schemas import AIRecommendation, ExposureItem, NewsAgentTurn, RiskAgentTurn

# News disagrees "strongly" with the analyst when its lean opposes the
# analyst's action and the weighted sentiment score is beyond this magnitude.
NEWS_DISAGREEMENT_THRESHOLD = 0.5


def _news_disagrees(action: str, news: NewsAgentTurn) -> bool:
    if action == "BUY" and news.lean == "bearish":
        return news.sentiment_score <= -NEWS_DISAGREEMENT_THRESHOLD
    if action == "SELL" and news.lean == "bullish":
        return news.sentiment_score >= NEWS_DISAGREEMENT_THRESHOLD
    return False


def _projected_concentration_pct(rec: AIRecommendation, exposures: list[ExposureItem]) -> float:
    existing = next((e for e in exposures if e.symbol == rec.symbol), None)
    return existing.pct_of_equity if existing else 0.0


def evaluate(
    rec: AIRecommendation,
    news: NewsAgentTurn,
    user: User,
    exposures: list[ExposureItem],
) -> RiskAgentTurn:
    if rec.action == "HOLD":
        return RiskAgentTurn(
            verdict="proceed",
            size_multiplier=1.0,
            reason="Analyst is already recommending HOLD — nothing for risk to gate.",
        )

    current_concentration = _projected_concentration_pct(rec, exposures)

    if rec.risk_level == "High" and user.risk_profile == RiskProfile.conservative:
        return RiskAgentTurn(
            verdict="veto",
            size_multiplier=0.0,
            reason=(
                f"{rec.symbol} is High risk right now, and this account's risk profile is "
                "conservative — vetoing to avoid a high-volatility position this account "
                "shouldn't be carrying unattended."
            ),
        )

    if current_concentration > CONCENTRATION_WARNING_PCT:
        return RiskAgentTurn(
            verdict="veto",
            size_multiplier=0.0,
            reason=(
                f"{rec.symbol} already makes up {current_concentration:.1f}% of equity, above "
                f"the {CONCENTRATION_WARNING_PCT:.0f}% concentration guideline — vetoing to avoid "
                "concentrating risk further."
            ),
        )

    if rec.risk_level == "High" and user.risk_profile == RiskProfile.moderate:
        return RiskAgentTurn(
            verdict="reduce",
            size_multiplier=0.5,
            reason=(
                f"{rec.symbol} is High risk for a moderate profile — halving size rather than "
                "vetoing outright."
            ),
        )

    if _news_disagrees(rec.action, news):
        return RiskAgentTurn(
            verdict="reduce",
            size_multiplier=0.5,
            reason=(
                f"News sentiment ({news.lean}, {news.sentiment_score:+.2f}) disagrees with the "
                f"analyst's {rec.action} — reducing size until the picture is clearer."
            ),
        )

    return RiskAgentTurn(
        verdict="proceed",
        size_multiplier=1.0,
        reason="No risk or concentration concerns for this trade at its proposed size.",
    )
