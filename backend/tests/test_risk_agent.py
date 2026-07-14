import datetime

from app.agents import risk_agent
from app.models import RiskProfile
from app.schemas import AIRecommendation, ExposureItem, IndicatorSnapshot, NewsAgentTurn


def _rec(action="BUY", risk_level="Low", confidence=70.0, symbol="BTC/USD") -> AIRecommendation:
    return AIRecommendation(
        symbol=symbol,
        action=action,
        confidence=confidence,
        risk_level=risk_level,
        expected_return_pct=1.0,
        reasons=["test reason"],
        indicators=IndicatorSnapshot(
            rsi=50, macd=0, macd_signal=0, ema_20=1, ema_50=1, sma_20=1,
            bollinger_upper=2, bollinger_lower=0, atr=0.1,
        ),
        price=100.0,
        generated_at=datetime.datetime.utcnow(),
    )


def _news(lean="neutral", score=0.0) -> NewsAgentTurn:
    return NewsAgentTurn(lean=lean, sentiment_score=score, reason="test")


class _FakeUser:
    def __init__(self, risk_profile: RiskProfile):
        self.risk_profile = risk_profile


def test_proceeds_when_nothing_is_wrong():
    result = risk_agent.evaluate(_rec(risk_level="Low"), _news(), _FakeUser(RiskProfile.moderate), [])
    assert result.verdict == "proceed"
    assert result.size_multiplier == 1.0


def test_vetoes_high_risk_for_conservative_profile():
    result = risk_agent.evaluate(
        _rec(risk_level="High"), _news(), _FakeUser(RiskProfile.conservative), []
    )
    assert result.verdict == "veto"
    assert result.size_multiplier == 0.0


def test_reduces_high_risk_for_moderate_profile():
    result = risk_agent.evaluate(
        _rec(risk_level="High"), _news(), _FakeUser(RiskProfile.moderate), []
    )
    assert result.verdict == "reduce"
    assert result.size_multiplier == 0.5


def test_vetoes_when_concentration_already_over_threshold():
    exposures = [ExposureItem(symbol="BTC/USD", value=1000, pct_of_equity=45.0)]
    result = risk_agent.evaluate(
        _rec(risk_level="Low", symbol="BTC/USD"), _news(), _FakeUser(RiskProfile.aggressive), exposures
    )
    assert result.verdict == "veto"


def test_reduces_when_news_strongly_disagrees():
    result = risk_agent.evaluate(
        _rec(action="BUY", risk_level="Low"),
        _news(lean="bearish", score=-0.8),
        _FakeUser(RiskProfile.aggressive),
        [],
    )
    assert result.verdict == "reduce"
    assert result.size_multiplier == 0.5


def test_proceeds_on_hold_regardless_of_risk():
    result = risk_agent.evaluate(
        _rec(action="HOLD", risk_level="High"), _news(), _FakeUser(RiskProfile.conservative), []
    )
    assert result.verdict == "proceed"
