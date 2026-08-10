from __future__ import annotations

from app.agents.nodes._helpers import compact_json, event, load_prompt
from app.agents.state import GraphState
from app.models.agents import CritiqueOutput
from app.services.llm import chat_json


def _slim_products(ideation: dict, n: int = 8) -> list[dict]:
    return [
        {
            "name": p.get("name"),
            "format": p.get("format"),
            "confidence": p.get("confidence"),
            "trend_rationale": p.get("trend_rationale"),
        }
        for p in (ideation.get("products") or [])[:n]
    ]


async def critique_node(state: GraphState) -> dict:
    prompt = load_prompt("critique.md")
    trends = state.get("trend_research", {})
    market = state.get("market_fit", {})
    competitors = state.get("competitor_deep_dive", {})
    unit_econ = state.get("unit_economics", {})
    compliance = state.get("compliance_claims", {})

    user = compact_json(
        {
            "brand_brief": state.get("brand_brief", {}),
            "trend_research": {
                "rising_themes": trends.get("rising_themes"),
                "declining_signals": trends.get("declining_signals"),
                "data_quality": trends.get("data_quality"),
            },
            "market_fit": {
                "icp_description": market.get("icp_description"),
                "whitespace": market.get("whitespace"),
                "competitive_landscape": market.get("competitive_landscape"),
                "price_band_usd": market.get("price_band_usd"),
            },
            "competitor_deep_dive": {
                "positioning_gaps": competitors.get("positioning_gaps"),
                "pricing_map": competitors.get("pricing_map"),
                "competitor_names": [c.get("name") for c in (competitors.get("competitors") or [])[:6]],
            },
            "product_ideation": {"products": _slim_products(state.get("product_ideation", {}))},
            "unit_economics": {
                "pricing_recommendation": unit_econ.get("pricing_recommendation"),
                "break_even": unit_econ.get("break_even"),
                "capital_required": unit_econ.get("capital_required"),
                "unit_economics_commentary": unit_econ.get("unit_economics_commentary"),
            },
            "compliance_claims": {
                "category_landmines": compliance.get("category_landmines"),
                "overall_regulatory_risk_score": compliance.get("overall_regulatory_risk_score"),
            },
        }
    )
    raw = await chat_json(prompt, user)
    parsed = CritiqueOutput.model_validate(raw)
    return {
        "critique": parsed.model_dump(),
        "events": [
            event(
                "critique",
                "completed",
                f"{len(parsed.tweaks)} tweaks · {len(parsed.risks)} risks",
            )
        ],
    }
