"""The "Coach" agent — narrates the other three agents' positions in plain
English. Same Claude-with-template-fallback safety net as explain.py, so a
missing/failed API key degrades gracefully instead of 500ing.
"""

from ..config import settings
from ..schemas import AIRecommendation, NewsAgentTurn, RiskAgentTurn

SYSTEM_PROMPT = """You are the "Coach" in a DEMO paper-trading platform's AI \
trading debate. Three other agents have already spoken: a Market Analyst \
(technical indicators), a News Agent (headline sentiment), and a Risk Agent \
(the only one with veto power). Your job is to narrate their positions and \
the final call in plain, friendly language a beginner can follow. Rules:
- Never claim certainty. Always frame this as one possible read of the data.
- Explicitly mention if the Risk Agent reduced or vetoed the trade, and why.
- Keep it to 3-5 sentences.
- End with a short reminder that this is a demo signal, not financial advice.
"""


def _template_summary(
    rec: AIRecommendation,
    news: NewsAgentTurn,
    risk: RiskAgentTurn,
    final_action: str,
    final_confidence: float,
) -> str:
    parts = [
        f"Market Analyst leans {rec.action} on {rec.symbol} ({rec.confidence:.0f}% confidence, "
        f"{rec.risk_level.lower()} risk).",
        f"News Agent reads sentiment as {news.lean} ({news.sentiment_score:+.2f}).",
    ]
    if risk.verdict == "veto":
        parts.append(f"Risk Agent vetoed this trade: {risk.reason}")
    elif risk.verdict == "reduce":
        parts.append(f"Risk Agent cut the size in half: {risk.reason}")
    else:
        parts.append("Risk Agent found no concerns and let it proceed at full size.")
    parts.append(
        f"Final call: {final_action} at {final_confidence:.0f}% confidence. "
        "This is a demo signal for educational purposes only — not financial advice."
    )
    return " ".join(parts)


def summarize(
    rec: AIRecommendation,
    news: NewsAgentTurn,
    risk: RiskAgentTurn,
    final_action: str,
    final_confidence: float,
) -> tuple[str, str]:
    if not settings.anthropic_api_key:
        return _template_summary(rec, news, risk, final_action, final_confidence), "template"

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        user_content = (
            f"Symbol: {rec.symbol}\n"
            f"Market Analyst: {rec.action} at {rec.confidence}% confidence, "
            f"{rec.risk_level} risk. Reasons: {', '.join(rec.reasons)}\n"
            f"News Agent: {news.lean} lean, sentiment {news.sentiment_score}. {news.reason}\n"
            f"Risk Agent verdict: {risk.verdict} (size multiplier {risk.size_multiplier}). "
            f"{risk.reason}\n"
            f"Final action: {final_action} at {final_confidence}% confidence.\n"
        )
        response = client.messages.create(
            model="claude-sonnet-5",
            max_tokens=300,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_content}],
        )
        text = "".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        )
        return text.strip(), "claude"
    except Exception:
        return _template_summary(rec, news, risk, final_action, final_confidence), "template"
