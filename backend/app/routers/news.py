from fastapi import APIRouter

from ..news import news_store
from ..schemas import NewsItemResponse

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("", response_model=list[NewsItemResponse])
def list_news(limit: int = 50):
    return news_store.list_items(limit=limit)
