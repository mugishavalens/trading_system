"""Fallback knowledge base used when no ANTHROPIC_API_KEY is configured.

Keyword-matched, not a real NLU system — good enough to keep the AI Assistant
useful offline, but the Claude path (see explain.py's pattern) is what gives
free-form answers.
"""

FAQ_ENTRIES: list[tuple[list[str], str]] = [
    (
        ["rsi", "relative strength"],
        "RSI (Relative Strength Index) measures how fast and how much a price "
        "has moved recently, on a 0-100 scale. Readings below 30 are often "
        "read as 'oversold' (a potential bounce), and above 70 as "
        "'overbought' (a potential pullback). It's a momentum signal, not a "
        "guarantee — strong trends can stay overbought or oversold for a long time.",
    ),
    (
        ["macd"],
        "MACD (Moving Average Convergence Divergence) compares two EMAs (12 "
        "and 26 period) to gauge momentum. When the MACD line crosses above "
        "its signal line, that's often read as bullish; crossing below is "
        "often read as bearish.",
    ),
    (
        ["ema", "exponential moving average"],
        "An EMA (Exponential Moving Average) is a moving average that weights "
        "recent prices more heavily than older ones, so it reacts faster to "
        "new price action than a simple moving average.",
    ),
    (
        ["sma", "simple moving average"],
        "An SMA (Simple Moving Average) is the average close price over a "
        "fixed window (e.g. 20 periods), weighted equally. It smooths out "
        "noise to show the underlying trend.",
    ),
    (
        ["bollinger"],
        "Bollinger Bands plot a moving average with an upper and lower band "
        "at some number of standard deviations away. Price near the upper "
        "band suggests it's relatively 'expensive' versus its recent range; "
        "near the lower band, relatively 'cheap'. Bands widen in volatile "
        "markets and narrow in quiet ones.",
    ),
    (
        ["atr", "average true range"],
        "ATR (Average True Range) measures volatility — the average size of "
        "price movement over a period. It's often used to size positions or "
        "set stop-losses relative to how much an asset typically moves.",
    ),
    (
        ["stop loss", "stop-loss"],
        "A stop-loss is an order that automatically closes a position once "
        "price moves against you by a set amount, capping downside risk on a "
        "trade before it grows.",
    ),
    (
        ["take profit"],
        "A take-profit order automatically closes a position once it reaches "
        "a target gain, locking in profit without needing to watch the market.",
    ),
    (
        ["risk management", "position sizing"],
        "Risk management is about controlling how much any single trade can "
        "hurt your account — position sizing (how much to buy), stop-losses, "
        "and diversification are the main tools. A common rule of thumb is "
        "risking only a small percentage of total capital on any one trade.",
    ),
    (
        ["candlestick", "candle"],
        "A candlestick shows open, high, low, and close price for a period. "
        "The 'body' spans open to close (green/up if close > open, red/down "
        "otherwise); the 'wicks' show the high/low extremes reached.",
    ),
    (
        ["support", "resistance"],
        "Support is a price level where an asset has tended to stop falling "
        "and bounce; resistance is a level where it has tended to stop "
        "rising and reverse. Both come from areas where past buying/selling "
        "pressure was strong.",
    ),
    (
        ["risk reward", "risk/reward"],
        "The risk/reward ratio compares how much you stand to lose (distance "
        "to your stop-loss) versus how much you stand to gain (distance to "
        "your target). Many traders look for ratios of at least 1:2, so a "
        "win is worth more than a loss.",
    ),
    (
        ["diversif"],
        "Diversification means spreading capital across different assets so "
        "no single position can do outsized damage to your portfolio if it "
        "moves against you.",
    ),
    (
        ["volatility"],
        "Volatility measures how much and how fast a price moves. Higher "
        "volatility means bigger potential swings in both directions — more "
        "opportunity, but also more risk.",
    ),
    (
        ["confidence"],
        "The confidence score on a recommendation reflects how strongly the "
        "underlying indicators agree with each other — it is not a "
        "probability of the trade being profitable. Even a high-confidence "
        "signal can be wrong; markets are inherently uncertain.",
    ),
    (
        ["paper trading", "demo"],
        "Paper trading (what this platform does) simulates real trading "
        "using virtual money, so you can practice strategy and risk "
        "management without financial risk.",
    ),
]

DEFAULT_ANSWER = (
    "I can walk through core trading concepts — try asking about RSI, MACD, "
    "moving averages, Bollinger Bands, stop-losses, risk management, "
    "candlesticks, support/resistance, or risk/reward ratios. For "
    "open-ended questions beyond this list, set ANTHROPIC_API_KEY on the "
    "backend to enable full conversational answers."
)


def faq_answer(question: str) -> str:
    q = question.lower()
    for keywords, answer in FAQ_ENTRIES:
        if any(k in q for k in keywords):
            return answer
    return DEFAULT_ANSWER
