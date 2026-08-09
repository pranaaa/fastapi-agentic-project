from __future__ import annotations

import json

from app.agents.nodes._helpers import event, load_prompt
from app.agents.state import GraphState
from app.models.brand import BrandBrief
from app.services.llm import chat_json


async def clarifier_node(state: GraphState) -> dict:
    prompt = load_prompt("clarifier.md")
    user = json.dumps({"wizard": state.get("wizard", {})}, default=str)
    raw = await chat_json(prompt, user)
    brief = BrandBrief.model_validate(raw)
    return {
        "brand_brief": brief.model_dump(),
        "events": [event("clarifier", "completed", "Brand brief normalized")],
    }
