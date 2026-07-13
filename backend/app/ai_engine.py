"""Rule-based AI decision engine.

Deliberately not a trained ML model: it combines a handful of well known
technical-analysis signals into a transparent, weighted score. Every decision
carries a plain-text reason for each contributing indicator, which is what
gets shown to the user (and optionally rephrased by Claude) as "why".
"""

import datetime

from sqlalchemy.orm import Session

from . import indicators
from .ai_config_service import get_ai_config
from .market_data import market_store
from .schemas import AIRecommendation, IndicatorSnapshot


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def build_recommendation(symbol: str, db: Session) -> AIRecommendation:
    config = get_ai_config(db)

    candles = market_store.get_candles(symbol, limit=180)
    df = indicators.to_dataframe(candles)
    ind = indicators.compute_all(df)
    price = float(df["close"].iloc[-1])

    reasons: list[str] = []
    score = 0.0

    # RSI: oversold/overbought
    rsi_val = ind["rsi"]
    if rsi_val < 30:
        rsi_signal = 1.0
        reasons.append(f"RSI is {rsi_val:.1f}, in oversold territory — often precedes a bounce (bullish).")
    elif rsi_val > 70:
        rsi_signal = -1.0
        reasons.append(f"RSI is {rsi_val:.1f}, in overbought territory — momentum may be stretched (bearish).")
    else:
        rsi_signal = (50 - rsi_val) / 50
        reasons.append(f"RSI is {rsi_val:.1f}, a neutral reading with no strong momentum signal.")
    score += config.rsi_weight * rsi_signal

    # MACD vs signal line
    macd_diff = ind["macd"] - ind["macd_signal"]
    macd_signal = _clamp(macd_diff / (abs(price) * 0.001 + 1e-6), -1, 1)
    if macd_diff > 0:
        reasons.append("MACD line is above its signal line, indicating bullish momentum.")
    else:
        reasons.append("MACD line is below its signal line, indicating bearish momentum.")
    score += config.macd_weight * macd_signal

    # EMA trend (20 vs 50)
    if ind["ema_20"] > ind["ema_50"]:
        ema_signal = 1.0
        reasons.append("Short-term EMA(20) is above EMA(50), suggesting an uptrend.")
    else:
        ema_signal = -1.0
        reasons.append("Short-term EMA(20) is below EMA(50), suggesting a downtrend.")
    score += config.ema_weight * ema_signal

    # Bollinger bands
    band_width = ind["bollinger_upper"] - ind["bollinger_lower"]
    if band_width > 0:
        position_in_band = (price - ind["bollinger_lower"]) / band_width
    else:
        position_in_band = 0.5
    if position_in_band <= 0.15:
        bb_signal = 1.0
        reasons.append("Price is trading near the lower Bollinger Band — a potential reversal zone.")
    elif position_in_band >= 0.85:
        bb_signal = -1.0
        reasons.append("Price is trading near the upper Bollinger Band — a potential pullback zone.")
    else:
        bb_signal = 0.0
        reasons.append("Price is trading within the middle of its Bollinger Bands — no extreme.")
    score += config.bollinger_weight * bb_signal

    # Price vs SMA20
    sma_signal = _clamp((price - ind["sma_20"]) / (ind["sma_20"] * 0.02 + 1e-6), -1, 1)
    if price > ind["sma_20"]:
        reasons.append("Price is above its 20-period moving average.")
    else:
        reasons.append("Price is below its 20-period moving average.")
    score += config.sma_weight * sma_signal

    score = _clamp(score, -1, 1)

    if score > config.buy_threshold:
        action = "BUY"
    elif score < config.sell_threshold:
        action = "SELL"
    else:
        action = "HOLD"

    confidence = round(50 + min(abs(score) * 50, 45), 1)

    volatility_ratio = ind["atr"] / price if price else 0
    if volatility_ratio > 0.03:
        risk_level = "High"
    elif volatility_ratio > 0.015:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    expected_return_pct = round(score * volatility_ratio * 100 * 2, 2)
    expected_return_pct = _clamp(expected_return_pct, -8, 8)

    return AIRecommendation(
        symbol=symbol,
        action=action,
        confidence=confidence,
        risk_level=risk_level,
        expected_return_pct=expected_return_pct,
        reasons=reasons,
        indicators=IndicatorSnapshot(**ind),
        price=price,
        generated_at=datetime.datetime.utcnow(),
    )
