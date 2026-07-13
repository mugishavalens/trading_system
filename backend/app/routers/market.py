from fastapi import APIRouter, HTTPException

from ..market_data import market_store
from ..schemas import Candle, SymbolInfo

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
