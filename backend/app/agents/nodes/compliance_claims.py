from __future__ import annotations

from app.agents.nodes._helpers import compact_json, event, load_prompt
from app.agents.state import GraphState
from app.models.agents import ComplianceClaimsOutput
from app.services.llm import chat_json


async def compliance_claims_node(state: GraphState) -> dict:
    prompt = load_prompt("compliance_claims.md")
    ideation = state.get("product_ideation", {})
    market = state.get("market_fit", {})

    # Send only the essentials — the model needs product names, hooks, ICP + geography.
    lead_products = [
        {
            "name": p.get("name"),
            "description": p.get("description"),
            "hook": p.get("hook"),
        }
        for p in (ideation.get("products") or [])[:8]
    ]

    user = compact_json(
        {
            "brand_brief": state.get("brand_brief", {}),
            "lead_products": lead_products,
            "market_fit": {
                "icp_description": market.get("icp_description"),
            },
        }
    )
    raw = await chat_json(prompt, user, max_tokens=4500)
    parsed = ComplianceClaimsOutput.model_validate(raw)
    return {
        "compliance_claims": parsed.model_dump(),
        "events": [
            event(
                "compliance_claims",
                "completed",
                f"Regulatory risk score: {parsed.overall_regulatory_risk_score.score}/5",
            )
        ],
    }
