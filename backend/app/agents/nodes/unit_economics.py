from __future__ import annotations

from app.agents.nodes._helpers import compact_json, event, load_prompt
from app.agents.state import GraphState
from app.models.agents import UnitEconomicsOutput
from app.services.llm import chat_json


def _lead_products(ideation: dict, n: int = 4) -> list[dict]:
    prods = ideation.get("products") or []
    # Prefer high-confidence heroes for the lead-product COGS example
    heroes = [p for p in prods if p.get("format") == "hero"]
    others = [p for p in prods if p.get("format") != "hero"]
    pick = (heroes + others)[:n]
    return [
        {
            "name": p.get("name"),
            "description": p.get("description"),
            "format": p.get("format"),
            "estimated_price_range": p.get("estimated_price_range"),
            "confidence": p.get("confidence"),
        }
        for p in pick
    ]


async def unit_economics_node(state: GraphState) -> dict:
    prompt = load_prompt("unit_economics.md")
    ideation = state.get("product_ideation", {})
    market = state.get("market_fit", {})
    user = compact_json(
        {
            "brand_brief": state.get("brand_brief", {}),
            "market_fit": {
                "icp_description": market.get("icp_description"),
                "price_band_usd": market.get("price_band_usd"),
                "willingness_to_pay_rationale": market.get("willingness_to_pay_rationale"),
                "occasions": market.get("occasions"),
            },
            "lead_products": _lead_products(ideation),
        }
    )
    raw = await chat_json(prompt, user)
    parsed = UnitEconomicsOutput.model_validate(raw)
    return {
        "unit_economics": parsed.model_dump(),
        "events": [event("unit_economics", "completed", "Unit economics modeled")],
    }
