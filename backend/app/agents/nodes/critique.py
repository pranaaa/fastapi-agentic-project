from __future__ import annotations

import json

from app.agents.nodes._helpers import event, load_prompt
from app.agents.state import GraphState
from app.models.agents import CritiqueOutput
from app.services.llm import chat_json


async def critique_node(state: GraphState) -> dict:
    prompt = load_prompt("critique.md")
    user = json.dumps(
        {
            "brand_brief": state.get("brand_brief", {}),
            "trend_research": state.get("trend_research", {}),
            "market_fit": state.get("market_fit", {}),
            "product_ideation": state.get("product_ideation", {}),
        },
        default=str,
    )
    raw = await chat_json(prompt, user)
    parsed = CritiqueOutput.model_validate(raw)
    return {
        "critique": parsed.model_dump(),
        "events": [event("critique", "completed", f"{len(parsed.tweaks)} tweaks suggested")],
    }
