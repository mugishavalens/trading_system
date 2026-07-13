from fastapi import APIRouter, Depends

from ..models import User
from ..news import news_store
from ..schemas import NewsItemResponse
from ..security import get_current_user

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("", response_model=list[NewsItemResponse])
def list_news(limit: int = 50, current_user: User = Depends(get_current_user)):
    return news_store.list_items(limit=limit)
