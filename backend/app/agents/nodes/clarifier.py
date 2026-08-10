from __future__ import annotations

from app.agents.nodes._helpers import compact_json, event, load_prompt
from app.agents.state import GraphState
from app.config import settings
from app.models.brand import BrandBrief
from app.services.llm import chat_json


async def clarifier_node(state: GraphState) -> dict:
    prompt = load_prompt("clarifier.md")
    user = compact_json({"wizard": state.get("wizard", {})})
    # Simple normalization task — route to the light model.
    raw = await chat_json(prompt, user, model=settings.llm_model_light)
    brief = BrandBrief.model_validate(raw)
    return {
        "brand_brief": brief.model_dump(),
        "events": [event("clarifier", "completed", "Brand brief normalized")],
    }
