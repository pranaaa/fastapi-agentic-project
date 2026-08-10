from __future__ import annotations

from app.agents.nodes._helpers import compact_json, event, load_prompt
from app.agents.state import GraphState
from app.models.agents import ProductIdeationOutput
from app.services.llm import chat_json


def _slim_trend(t: dict) -> dict:
    return {
        "rising_themes": t.get("rising_themes"),
        "emerging_ingredients": t.get("emerging_ingredients"),
        "declining_signals": t.get("declining_signals"),
        "data_quality": t.get("data_quality"),
    }


def _slim_market(m: dict) -> dict:
    return {
        "icp_description": m.get("icp_description"),
        "occasions": m.get("occasions"),
        "whitespace": m.get("whitespace"),
        "price_band_usd": m.get("price_band_usd"),
    }


def _slim_competitors(c: dict) -> dict:
    return {
        "positioning_gaps": c.get("positioning_gaps"),
        "pricing_map": c.get("pricing_map"),
        "competitors": [
            {"name": x.get("name"), "positioning": x.get("positioning"), "weaknesses": x.get("weaknesses")}
            for x in (c.get("competitors") or [])[:6]
        ],
    }


async def product_ideation_node(state: GraphState) -> dict:
    prompt = load_prompt("product_ideation.md")
    user = compact_json(
        {
            "brand_brief": state.get("brand_brief", {}),
            "trend_research": _slim_trend(state.get("trend_research", {})),
            "market_fit": _slim_market(state.get("market_fit", {})),
            "competitor_deep_dive": _slim_competitors(state.get("competitor_deep_dive", {})),
        }
    )
    raw = await chat_json(prompt, user)
    parsed = ProductIdeationOutput.model_validate(raw)
    return {
        "product_ideation": parsed.model_dump(),
        "events": [
            event(
                "product_ideation",
                "completed",
                f"{len(parsed.products)} product ideas generated",
            )
        ],
    }
