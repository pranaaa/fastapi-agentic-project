from __future__ import annotations

import json

from app.agents.nodes._helpers import event, load_prompt
from app.agents.state import GraphState
from app.models.agents import ProductIdeationOutput
from app.services.llm import chat_json


async def product_ideation_node(state: GraphState) -> dict:
    prompt = load_prompt("product_ideation.md")
    user = json.dumps(
        {
            "brand_brief": state.get("brand_brief", {}),
            "trend_research": state.get("trend_research", {}),
            "market_fit": state.get("market_fit", {}),
        },
        default=str,
    )
    raw = await chat_json(prompt, user)
    parsed = ProductIdeationOutput.model_validate(raw)
    return {
        "product_ideation": parsed.model_dump(),
        "events": [event("product_ideation", "completed", f"{len(parsed.products)} product ideas generated")],
    }
