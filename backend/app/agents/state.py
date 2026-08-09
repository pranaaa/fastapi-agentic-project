from __future__ import annotations

from typing import Annotated, TypedDict

from langgraph.graph.message import add_messages  # noqa: F401 - kept for parity if needed


def _merge(existing, new):
    """Reducer for the events list — always concatenate."""
    if existing is None:
        return list(new or [])
    return list(existing) + list(new or [])


class GraphState(TypedDict, total=False):
    session_id: str
    wizard: dict
    brand_brief: dict
    trend_research: dict
    market_fit: dict
    product_ideation: dict
    critique: dict
    report: dict
    events: Annotated[list[dict], _merge]
    error: str | None
