from __future__ import annotations

from app.agents.nodes._helpers import compact_json, event, load_prompt
from app.agents.state import GraphState
from app.models.agents import CompetitorDeepDiveOutput
from app.services.llm import chat_json


async def competitor_deep_dive_node(state: GraphState) -> dict:
    prompt = load_prompt("competitor_deep_dive.md")
    user = compact_json({"brand_brief": state.get("brand_brief", {})})
    raw = await chat_json(prompt, user)
    parsed = CompetitorDeepDiveOutput.model_validate(raw)
    return {
        "competitor_deep_dive": parsed.model_dump(),
        "events": [
            event(
                "competitor_deep_dive",
                "completed",
                f"{len(parsed.competitors)} competitors mapped",
            )
        ],
    }
