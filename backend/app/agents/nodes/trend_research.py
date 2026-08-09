from __future__ import annotations

import json

from app.agents.nodes._helpers import event, load_prompt
from app.agents.state import GraphState
from app.models.agents import TrendResearchOutput
from app.services.llm import chat_json
from app.services.trends import fetch_signals_for_keywords


async def trend_research_node(state: GraphState) -> dict:
    brief = state.get("brand_brief") or {}
    keywords = (brief.get("trend_keywords") or [])[:5]

    signals, data_quality_hint = await fetch_signals_for_keywords(keywords)

    prompt = load_prompt("trend_research.md")
    user = json.dumps(
        {
            "brand_brief": brief,
            "trend_signals": signals,
            "data_quality_hint": data_quality_hint,
        },
        default=str,
    )
    raw = await chat_json(prompt, user)
    parsed = TrendResearchOutput.model_validate(raw)
    return {
        "trend_research": parsed.model_dump(),
        "events": [event("trend_research", "completed", f"Trends analyzed ({parsed.data_quality})")],
    }
