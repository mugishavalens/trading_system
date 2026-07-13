from fastapi import APIRouter, Depends

from ..config import settings
from ..faq import faq_answer
from ..models import User
from ..schemas import ChatRequest, ChatResponse
from ..security import get_current_user

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

SYSTEM_PROMPT = """You are an AI trading education assistant inside a DEMO \
paper-trading platform aimed at beginner-to-advanced traders. Rules:
- Teach concepts clearly and simply; use examples when helpful.
- Never claim certainty about future price moves, and never give personalized \
financial advice — this is a demo, educational tool only.
- Keep answers focused and conversational, generally under 200 words unless \
the question needs more.
"""


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, current_user: User = Depends(get_current_user)):
    if not settings.anthropic_api_key:
        return ChatResponse(reply=faq_answer(payload.message), generated_by="faq")

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        messages = [
            {"role": m.role, "content": m.content} for m in payload.history
        ]
        messages.append({"role": "user", "content": payload.message})

        response = client.messages.create(
            model="claude-sonnet-5",
            max_tokens=500,
            system=SYSTEM_PROMPT,
            messages=messages,
        )
        text = "".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        )
        return ChatResponse(reply=text.strip(), generated_by="claude")
    except Exception:
        return ChatResponse(reply=faq_answer(payload.message), generated_by="faq")
