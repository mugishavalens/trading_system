from fastapi import APIRouter, Depends, HTTPException

from ..ai_engine import build_recommendation
from ..explain import generate_explanation
from ..market_data import SYMBOLS
from ..models import User
from ..schemas import AIRecommendation, ExplainResponse
from ..security import get_current_user

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _validate_symbol(symbol: str):
    if symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail=f"Unknown symbol: {symbol}")


@router.get("/recommendation/{symbol:path}", response_model=AIRecommendation)
def get_recommendation(symbol: str, current_user: User = Depends(get_current_user)):
    _validate_symbol(symbol)
    return build_recommendation(symbol)


@router.get("/recommendations", response_model=list[AIRecommendation])
def get_all_recommendations(current_user: User = Depends(get_current_user)):
    return [build_recommendation(symbol) for symbol in SYMBOLS]


@router.get("/explain/{symbol:path}", response_model=ExplainResponse)
def explain(symbol: str, current_user: User = Depends(get_current_user)):
    _validate_symbol(symbol)
    rec = build_recommendation(symbol)
    text, source = generate_explanation(rec)
    return ExplainResponse(symbol=symbol, explanation=text, generated_by=source)
