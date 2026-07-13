"""Synthetic OHLCV market data.

No external API keys or network calls required for the demo: each symbol is
seeded with a random walk that looks like a real price history, and every time
it's polled it takes one more small "live" step so the dashboard feels alive.
"""

import datetime
import random
import threading

SYMBOLS = {
    "BTC/USD": {"name": "Bitcoin", "asset_class": "crypto", "base_price": 61_000, "vol": 0.018},
    "ETH/USD": {"name": "Ethereum", "asset_class": "crypto", "base_price": 3_400, "vol": 0.022},
    "SOL/USD": {"name": "Solana", "asset_class": "crypto", "base_price": 145, "vol": 0.03},
    "AAPL": {"name": "Apple Inc.", "asset_class": "stock", "base_price": 210, "vol": 0.011},
    "TSLA": {"name": "Tesla Inc.", "asset_class": "stock", "base_price": 250, "vol": 0.025},
}

HISTORY_LENGTH = 180


class SymbolSeries:
    def __init__(self, symbol: str, base_price: float, vol: float, seed: int):
        self.symbol = symbol
        self.vol = vol
        self._rng = random.Random(seed)
        self.candles: list[dict] = self._seed_history(base_price)

    def _seed_history(self, base_price: float) -> list[dict]:
        candles = []
        price = base_price
        now = datetime.datetime.utcnow()
        start = now - datetime.timedelta(minutes=HISTORY_LENGTH)
        for i in range(HISTORY_LENGTH):
            drift = self._rng.gauss(0, self.vol)
            open_price = price
            close_price = max(open_price * (1 + drift), 0.01)
            high = max(open_price, close_price) * (1 + abs(self._rng.gauss(0, self.vol / 3)))
            low = min(open_price, close_price) * (1 - abs(self._rng.gauss(0, self.vol / 3)))
            volume = abs(self._rng.gauss(1_000_000, 300_000))
            candles.append(
                {
                    "time": (start + datetime.timedelta(minutes=i)).isoformat(),
                    "open": round(open_price, 4),
                    "high": round(high, 4),
                    "low": round(low, 4),
                    "close": round(close_price, 4),
                    "volume": round(volume, 2),
                }
            )
            price = close_price
        return candles

    def tick(self) -> dict:
        """Advance the series by one live step and return the newest candle."""
        last = self.candles[-1]
        drift = self._rng.gauss(0, self.vol)
        open_price = last["close"]
        close_price = max(open_price * (1 + drift), 0.01)
        high = max(open_price, close_price) * (1 + abs(self._rng.gauss(0, self.vol / 3)))
        low = min(open_price, close_price) * (1 - abs(self._rng.gauss(0, self.vol / 3)))
        volume = abs(self._rng.gauss(1_000_000, 300_000))
        candle = {
            "time": datetime.datetime.utcnow().isoformat(),
            "open": round(open_price, 4),
            "high": round(high, 4),
            "low": round(low, 4),
            "close": round(close_price, 4),
            "volume": round(volume, 2),
        }
        self.candles.append(candle)
        if len(self.candles) > HISTORY_LENGTH * 3:
            self.candles = self.candles[-HISTORY_LENGTH * 2 :]
        return candle

    @property
    def last_price(self) -> float:
        return self.candles[-1]["close"]

    def change_pct(self, lookback: int = 60) -> float:
        window = self.candles[-lookback:] if len(self.candles) >= lookback else self.candles
        start_price = window[0]["open"]
        return ((self.last_price - start_price) / start_price) * 100


class MarketDataStore:
    """In-memory store, ticked lazily (at most once every couple of seconds
    per symbol) so repeated requests within the same moment stay stable."""

    MIN_TICK_INTERVAL = datetime.timedelta(seconds=2)

    def __init__(self):
        self._lock = threading.Lock()
        self._series: dict[str, SymbolSeries] = {}
        self._last_tick: dict[str, datetime.datetime] = {}
        for i, (symbol, meta) in enumerate(SYMBOLS.items()):
            self._series[symbol] = SymbolSeries(
                symbol, meta["base_price"], meta["vol"], seed=1000 + i
            )
            self._last_tick[symbol] = datetime.datetime.utcnow()

    def _maybe_tick(self, symbol: str) -> None:
        now = datetime.datetime.utcnow()
        if now - self._last_tick[symbol] >= self.MIN_TICK_INTERVAL:
            with self._lock:
                self._series[symbol].tick()
                self._last_tick[symbol] = now

    def list_symbols(self) -> list[dict]:
        out = []
        for symbol, meta in SYMBOLS.items():
            self._maybe_tick(symbol)
            series = self._series[symbol]
            out.append(
                {
                    "symbol": symbol,
                    "name": meta["name"],
                    "asset_class": meta["asset_class"],
                    "last_price": series.last_price,
                    "change_pct_24h": round(series.change_pct(), 2),
                }
            )
        return out

    def get_candles(self, symbol: str, limit: int = 120) -> list[dict]:
        if symbol not in self._series:
            raise KeyError(symbol)
        self._maybe_tick(symbol)
        return self._series[symbol].candles[-limit:]

    def get_last_price(self, symbol: str) -> float:
        if symbol not in self._series:
            raise KeyError(symbol)
        self._maybe_tick(symbol)
        return self._series[symbol].last_price


market_store = MarketDataStore()
