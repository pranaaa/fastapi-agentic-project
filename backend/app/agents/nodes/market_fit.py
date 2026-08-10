from __future__ import annotations

from app.agents.nodes._helpers import compact_json, event, load_prompt
from app.agents.state import GraphState
from app.models.agents import MarketFitOutput
from app.services.llm import chat_json


async def market_fit_node(state: GraphState) -> dict:
    prompt = load_prompt("market_fit.md")
    user = compact_json({"brand_brief": state.get("brand_brief", {})})
    raw = await chat_json(prompt, user)
    parsed = MarketFitOutput.model_validate(raw)
    return {
        "market_fit": parsed.model_dump(),
        "events": [event("market_fit", "completed", "Market fit analyzed")],
    }
