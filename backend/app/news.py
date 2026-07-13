"""Synthetic news feed with sentiment/impact scoring.

No real news API key required for the demo: headlines are generated from
templates per symbol, each tagged with a sentiment and an impact score, the
same shape a real News Intelligence module (per the product spec) would
produce. The News page in the UI carries its own "synthetic" disclaimer so
this stays honest without repeating itself in every card.
"""

import datetime
import itertools
import random
import threading

from .market_data import SYMBOLS

HEADLINE_TEMPLATES = {
    "positive": [
        "{name} rallies as investor sentiment turns bullish",
        "Analysts raise price targets for {name}",
        "{name} sees strong buying volume amid positive momentum",
        "Institutional interest in {name} reportedly increasing",
        "{name} breaks above key resistance level",
    ],
    "negative": [
        "{name} slides on profit-taking after recent gains",
        "Analysts flag caution on {name} amid rising volatility",
        "{name} sees selling pressure as momentum fades",
        "Broader market jitters weigh on {name}",
        "{name} dips below short-term support",
    ],
    "neutral": [
        "{name} trades sideways as markets await fresh catalysts",
        "{name} holds steady in a quiet trading session",
        "Market watchers eye {name} ahead of upcoming data",
        "{name} consolidates near its recent range",
    ],
}

SUMMARY_TEMPLATES = {
    "positive": (
        "{name} is attracting buying interest today, with market commentary "
        "pointing to improving momentum and a constructive short-term setup."
    ),
    "negative": (
        "{name} is facing selling pressure today, with commentary flagging "
        "weaker momentum and a more cautious short-term setup."
    ),
    "neutral": (
        "{name} is little changed today, with no clear catalyst pushing "
        "price meaningfully in either direction."
    ),
}

HISTORY_SIZE = 40
TICK_INTERVAL = datetime.timedelta(minutes=2)


class NewsStore:
    def __init__(self):
        self._lock = threading.Lock()
        self._rng = random.Random(7)
        self._counter = itertools.count(1)
        self._items: list[dict] = []
        self._last_tick = datetime.datetime.utcnow()
        self._seed_history()

    def _make_item(self, symbol: str, published_at: datetime.datetime) -> dict:
        name = SYMBOLS[symbol]["name"]
        sentiment = self._rng.choice(["positive", "negative", "neutral"])
        headline = self._rng.choice(HEADLINE_TEMPLATES[sentiment]).format(name=name)
        summary = SUMMARY_TEMPLATES[sentiment].format(name=name)
        impact = self._rng.randint(6, 9) if sentiment != "neutral" else self._rng.randint(2, 5)
        return {
            "id": str(next(self._counter)),
            "symbol": symbol,
            "headline": headline,
            "summary": summary,
            "sentiment": sentiment,
            "impact_score": impact,
            "published_at": published_at,
        }

    def _seed_history(self) -> None:
        now = datetime.datetime.utcnow()
        symbols = list(SYMBOLS.keys())
        for i in range(HISTORY_SIZE):
            symbol = symbols[i % len(symbols)]
            published_at = now - datetime.timedelta(minutes=self._rng.randint(0, 60 * 12))
            self._items.append(self._make_item(symbol, published_at))
        self._items.sort(key=lambda item: item["published_at"], reverse=True)

    def _maybe_tick(self) -> None:
        now = datetime.datetime.utcnow()
        if now - self._last_tick >= TICK_INTERVAL:
            with self._lock:
                symbol = self._rng.choice(list(SYMBOLS.keys()))
                self._items.insert(0, self._make_item(symbol, now))
                self._items = self._items[: HISTORY_SIZE * 2]
                self._last_tick = now

    def list_items(self, limit: int = 50) -> list[dict]:
        self._maybe_tick()
        return self._items[:limit]


news_store = NewsStore()
