from __future__ import annotations

from app.agents.nodes._helpers import compact_json, event, load_prompt
from app.agents.state import GraphState
from app.models.agents import BrandNamingOutput
from app.services.llm import chat_json


async def brand_naming_node(state: GraphState) -> dict:
    prompt = load_prompt("brand_naming.md")
    market_fit = state.get("market_fit") or {}
    # Naming only needs the ICP and positioning cues, not the full playbook.
    market_slim = {
        "icp_description": market_fit.get("icp_description"),
        "willingness_to_pay_rationale": market_fit.get("willingness_to_pay_rationale"),
        "whitespace": market_fit.get("whitespace"),
    }
    user = compact_json(
        {
            "brand_brief": state.get("brand_brief", {}),
            "market_fit": market_slim,
        }
    )
    raw = await chat_json(prompt, user)
    parsed = BrandNamingOutput.model_validate(raw)
    return {
        "brand_naming": parsed.model_dump(),
        "events": [
            event(
                "brand_naming",
                "completed",
                f"{len(parsed.name_candidates)} name candidates + {len(parsed.taglines)} taglines",
            )
        ],
    }
