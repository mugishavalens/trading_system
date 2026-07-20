from fastapi import APIRouter, HTTPException

from .. import indicators
from ..market_data import market_store
from ..schemas import Candle, IndicatorSeriesResponse, SymbolInfo

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/symbols", response_model=list[SymbolInfo])
def list_symbols():
    return market_store.list_symbols()


@router.get("/candles/{symbol:path}", response_model=list[Candle])
def get_candles(symbol: str, limit: int = 120):
    try:
        return market_store.get_candles(symbol, limit=limit)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Unknown symbol: {symbol}")


@router.get("/indicators/{symbol:path}", response_model=IndicatorSeriesResponse)
def get_indicator_series(symbol: str, limit: int = 120):
    try:
        candles = market_store.get_candles(symbol, limit=limit)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Unknown symbol: {symbol}")
    df = indicators.to_dataframe(candles)
    series = indicators.compute_series(df)
    return IndicatorSeriesResponse(time=[c["time"] for c in candles], **series)
