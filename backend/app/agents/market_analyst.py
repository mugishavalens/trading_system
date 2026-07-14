"""The "Market Analyst" agent — just the existing rule-based engine.

Kept as its own module (rather than importing ai_engine directly everywhere)
so the debate orchestrator reads like a roster of agents, not a mix of one
agent module and one bare function.
"""

from ..ai_engine import build_recommendation as evaluate

__all__ = ["evaluate"]
