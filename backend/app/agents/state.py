from __future__ import annotations

from typing import Annotated, TypedDict


def _merge_events(existing, new):
    if existing is None:
        return list(new or [])
    return list(existing) + list(new or [])


class GraphState(TypedDict, total=False):
    session_id: str
    wizard: dict
    brand_brief: dict
    trend_research: dict
    market_fit: dict
    competitor_deep_dive: dict
    product_ideation: dict
    unit_economics: dict
    brand_naming: dict
    critique: dict
    compliance_claims: dict
    launch_playbook: dict
    report: dict
    events: Annotated[list[dict], _merge_events]
    error: str | None
