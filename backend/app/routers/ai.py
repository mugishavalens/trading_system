from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..agents import debate
from ..ai_engine import build_recommendation
from ..database import get_db
from ..explain import generate_explanation
from ..market_data import SYMBOLS
from ..models import User
from ..schemas import AIRecommendation, DebateResult, ExplainResponse
from ..security import get_current_user

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _validate_symbol(symbol: str):
    if symbol not in SYMBOLS:
        raise HTTPException(status_code=404, detail=f"Unknown symbol: {symbol}")


@router.get("/recommendation/{symbol:path}", response_model=AIRecommendation)
def get_recommendation(
    symbol: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    _validate_symbol(symbol)
    return build_recommendation(symbol, db)


@router.get("/recommendations", response_model=list[AIRecommendation])
def get_all_recommendations(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return [build_recommendation(symbol, db) for symbol in SYMBOLS]


@router.get("/explain/{symbol:path}", response_model=ExplainResponse)
def explain(
    symbol: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    _validate_symbol(symbol)
    rec = build_recommendation(symbol, db)
    text, source = generate_explanation(rec)
    return ExplainResponse(symbol=symbol, explanation=text, generated_by=source)


@router.get("/debate/{symbol:path}", response_model=DebateResult)
def get_debate(
    symbol: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    _validate_symbol(symbol)
    return debate.evaluate(symbol, db, current_user)
