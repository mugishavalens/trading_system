"""Technical indicator calculations over a DataFrame of OHLCV candles."""

import numpy as np
import pandas as pd


def to_dataframe(candles: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(candles)
    df["time"] = pd.to_datetime(df["time"])
    return df


def rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    result = 100 - (100 / (1 + rs))
    return result.fillna(50)


def ema(close: pd.Series, span: int) -> pd.Series:
    return close.ewm(span=span, adjust=False).mean()


def sma(close: pd.Series, window: int) -> pd.Series:
    return close.rolling(window=window, min_periods=1).mean()


def macd(close: pd.Series) -> tuple[pd.Series, pd.Series]:
    macd_line = ema(close, 12) - ema(close, 26)
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    return macd_line, signal_line


def bollinger_bands(close: pd.Series, window: int = 20, num_std: float = 2.0):
    mid = sma(close, window)
    std = close.rolling(window=window, min_periods=1).std().fillna(0)
    upper = mid + num_std * std
    lower = mid - num_std * std
    return upper, lower


def atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high_low = df["high"] - df["low"]
    high_close = (df["high"] - df["close"].shift()).abs()
    low_close = (df["low"] - df["close"].shift()).abs()
    true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    return true_range.ewm(alpha=1 / period, min_periods=period, adjust=False).mean().fillna(
        true_range
    )


def compute_all(df: pd.DataFrame) -> dict:
    close = df["close"]
    macd_line, signal_line = macd(close)
    upper, lower = bollinger_bands(close)
    return {
        "rsi": float(rsi(close).iloc[-1]),
        "macd": float(macd_line.iloc[-1]),
        "macd_signal": float(signal_line.iloc[-1]),
        "ema_20": float(ema(close, 20).iloc[-1]),
        "ema_50": float(ema(close, 50).iloc[-1]),
        "sma_20": float(sma(close, 20).iloc[-1]),
        "bollinger_upper": float(upper.iloc[-1]),
        "bollinger_lower": float(lower.iloc[-1]),
        "atr": float(atr(df).iloc[-1]),
    }
