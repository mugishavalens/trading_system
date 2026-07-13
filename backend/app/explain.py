"""Turns a structured AIRecommendation into a plain-English explanation.

Uses Claude when ANTHROPIC_API_KEY is configured; otherwise falls back to a
deterministic template built from the same reasons list, so the feature works
with zero external dependencies for a pure local demo.
"""

from .config import settings
from .schemas import AIRecommendation

SYSTEM_PROMPT = """You are an AI trading education assistant inside a DEMO \
paper-trading platform. You are explaining why a rule-based technical \
analysis engine produced a BUY/SELL/HOLD signal. Rules:
- Never claim certainty. Always frame this as one possible read of the data.
- Reference the confidence score, risk level, and 2-3 of the most important \
reasons in plain, friendly language a beginner can follow.
- Keep it to 3-5 sentences.
- End with a short reminder that this is a demo signal, not financial advice, \
and markets are uncertain.
"""


def _template_explanation(rec: AIRecommendation) -> str:
    top_reasons = "; ".join(rec.reasons[:3])
    return (
        f"The engine is leaning {rec.action} on {rec.symbol} with {rec.confidence:.0f}% "
        f"confidence and {rec.risk_level.lower()} estimated risk. Key signals: {top_reasons}. "
        f"An illustrative expected move over the near term is about {rec.expected_return_pct:+.2f}%, "
        f"though that is a rough heuristic, not a prediction. "
        f"This is a demo signal for educational purposes only — markets are uncertain and this is not financial advice."
    )


def generate_explanation(rec: AIRecommendation) -> tuple[str, str]:
    if not settings.anthropic_api_key:
        return _template_explanation(rec), "template"

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        user_content = (
            f"Symbol: {rec.symbol}\n"
            f"Action: {rec.action}\n"
            f"Confidence: {rec.confidence}%\n"
            f"Risk level: {rec.risk_level}\n"
            f"Illustrative expected return: {rec.expected_return_pct}%\n"
            f"Reasons: {', '.join(rec.reasons)}\n"
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
        return _template_explanation(rec), "template"
