"""The "News Agent" — turns recent synthetic headlines into a lean.

Pure function over the in-memory news store; no DB access.
"""

import datetime

from ..news import news_store
from ..schemas import NewsAgentTurn

SENTIMENT_SCORE = {"positive": 1.0, "negative": -1.0, "neutral": 0.0}


def evaluate(symbol: str, lookback_minutes: int = 180) -> NewsAgentTurn:
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(minutes=lookback_minutes)
    items = [
        item
        for item in news_store.list_items(limit=200)
        if item["symbol"] == symbol and item["published_at"] >= cutoff
    ]

    if not items:
        return NewsAgentTurn(
            lean="neutral",
            sentiment_score=0.0,
            reason="No recent headlines for this symbol — no news signal either way.",
        )

    weighted_sum = sum(SENTIMENT_SCORE[i["sentiment"]] * i["impact_score"] for i in items)
    weight_total = sum(i["impact_score"] for i in items)
    score = weighted_sum / weight_total if weight_total else 0.0

    if score > 0.25:
        lean = "bullish"
    elif score < -0.25:
        lean = "bearish"
    else:
        lean = "neutral"

    top = max(items, key=lambda i: i["impact_score"])
    reason = (
        f"{len(items)} recent headline(s), net {lean} (weighted sentiment {score:+.2f}). "
        f"Most impactful: \"{top['headline']}\" (impact {top['impact_score']}/10)."
    )

    return NewsAgentTurn(lean=lean, sentiment_score=round(score, 2), reason=reason)
