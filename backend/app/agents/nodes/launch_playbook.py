from __future__ import annotations

from app.agents.nodes._helpers import compact_json, event, load_prompt
from app.agents.state import GraphState
from app.models.agents import LaunchPlaybookOutput
from app.services.llm import chat_json


async def launch_playbook_node(state: GraphState) -> dict:
    prompt = load_prompt("launch_playbook.md")
    market = state.get("market_fit", {})
    ideation = state.get("product_ideation", {})
    critique = state.get("critique", {})
    unit_econ = state.get("unit_economics", {})

    user = compact_json(
        {
            "brand_brief": state.get("brand_brief", {}),
            "market_fit": {
                "icp_description": market.get("icp_description"),
                "occasions": market.get("occasions"),
                "buying_triggers": market.get("buying_triggers"),
                "channel_recommendations": market.get("channel_recommendations"),
            },
            "lead_products": [
                {"name": p.get("name"), "hook": p.get("hook"), "format": p.get("format")}
                for p in (ideation.get("products") or [])[:6]
            ],
            "critique": {
                "gaps": critique.get("gaps"),
                "risks": [
                    {"category": r.get("category"), "risk": r.get("risk")}
                    for r in (critique.get("risks") or [])[:5]
                ],
                "kill_criteria": critique.get("kill_criteria"),
            },
            "unit_economics": {
                "pricing_recommendation": unit_econ.get("pricing_recommendation"),
                "break_even": unit_econ.get("break_even"),
                "capital_required": unit_econ.get("capital_required"),
            },
        }
    )
    raw = await chat_json(prompt, user, max_tokens=5000)
    parsed = LaunchPlaybookOutput.model_validate(raw)
    return {
        "launch_playbook": parsed.model_dump(),
        "events": [event("launch_playbook", "completed", "90-day launch playbook drafted")],
    }
