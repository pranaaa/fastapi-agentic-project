from __future__ import annotations

from app.agents.nodes._helpers import compact_json, event, load_prompt
from app.agents.state import GraphState
from app.models.agents import ReportOutput
from app.services.llm import chat_json

REQUIRED_HEADINGS = [
    "## Executive Summary",
    "## 1. Idea Snapshot",
    "## 2. Target Customer & Occasion",
    "## 3. Trend Signals",
    "## 4. Competitive Landscape",
    "## 5. Recommended Products",
    "## 6. Positioning & Differentiation",
    "## 7. Brand Naming & Verbal Identity",
    "## 8. Unit Economics Snapshot",
    "## 9. Compliance & Claims Review",
    "## 10. Go-to-Market Playbook",
    "## 11. Risks & Kill Criteria",
    "## 12. Suggested Tweaks",
    "## 13. Contrarian Bets",
    "## 14. What To Do This Week",
    "## Appendix: Data Sources",
]


def _ensure_headings(md: str) -> str:
    for h in REQUIRED_HEADINGS:
        if h not in md:
            md += f"\n\n{h}\n\n_Not generated in this run._"
    return md


def _shorten(s: str | None, n: int) -> str:
    if not s:
        return ""
    s = s.strip()
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"


def _slim_brief(brief: dict) -> dict:
    return {
        "brand_name": brief.get("brand_name"),
        "concept": brief.get("concept"),
        "category": brief.get("category"),
        "geography": brief.get("geography"),
        "business_format": brief.get("business_format"),
        "price_tier": brief.get("price_tier"),
        "target_customer_summary": brief.get("target_customer_summary"),
        "hero_products": brief.get("hero_products"),
        "goals": brief.get("goals"),
    }


def _opportunity_inputs(state: GraphState) -> dict:
    """Everything the opportunity-half report writer needs."""
    trends = state.get("trend_research", {}) or {}
    market = state.get("market_fit", {}) or {}
    competitors = state.get("competitor_deep_dive", {}) or {}
    ideation = state.get("product_ideation", {}) or {}
    naming = state.get("brand_naming", {}) or {}

    return {
        "brand_brief": _slim_brief(state.get("brand_brief", {}) or {}),
        "trend_research": {
            "rising_themes": (trends.get("rising_themes") or [])[:5],
            "declining_signals": (trends.get("declining_signals") or [])[:3],
            "channel_insights": (trends.get("channel_insights") or [])[:4],
            "emerging_ingredients": (trends.get("emerging_ingredients") or [])[:5],
            "cultural_context": _shorten(trends.get("cultural_context"), 400),
            "signals": [
                {"keyword": s.get("keyword"), "source": s.get("source"), "direction": s.get("direction"), "note": _shorten(s.get("note"), 100)}
                for s in (trends.get("signals") or [])[:8]
            ],
            "data_quality": trends.get("data_quality"),
        },
        "market_fit": {
            "icp_description": _shorten(market.get("icp_description"), 450),
            "jobs_to_be_done": (market.get("jobs_to_be_done") or [])[:3],
            "occasions": (market.get("occasions") or [])[:5],
            "buying_triggers": (market.get("buying_triggers") or [])[:4],
            "price_band_usd": market.get("price_band_usd"),
            "whitespace": (market.get("whitespace") or [])[:4],
        },
        "competitor_deep_dive": {
            "pricing_map": _shorten(competitors.get("pricing_map"), 350),
            "positioning_gaps": (competitors.get("positioning_gaps") or [])[:4],
            "five_forces_summary": (competitors.get("five_forces_summary") or [])[:5],
            "competitors": [
                {
                    "name": c.get("name"),
                    "type": c.get("type"),
                    "positioning": _shorten(c.get("positioning"), 130),
                    "price_band_usd": c.get("price_band_usd"),
                    "weaknesses": (c.get("weaknesses") or [])[:2],
                }
                for c in (competitors.get("competitors") or [])[:6]
            ],
        },
        "product_ideation": {
            "products": [
                {
                    "name": p.get("name"),
                    "description": _shorten(p.get("description"), 200),
                    "hook": _shorten(p.get("hook"), 100),
                    "trend_rationale": _shorten(p.get("trend_rationale"), 140),
                    "confidence": p.get("confidence"),
                    "estimated_price_range": p.get("estimated_price_range"),
                    "format": p.get("format"),
                }
                for p in (ideation.get("products") or [])[:8]
            ]
        },
        "brand_naming": {
            "keep_current_name": naming.get("keep_current_name"),
            "keep_current_name_rationale": _shorten(naming.get("keep_current_name_rationale"), 180),
            "name_candidates": [
                {
                    "name": n.get("name"),
                    "style": n.get("style"),
                    "rationale": _shorten(n.get("rationale"), 100),
                }
                for n in (naming.get("name_candidates") or [])[:4]
            ],
            "taglines": (naming.get("taglines") or [])[:4],
            "verbal_identity": {
                "voice_adjectives": ((naming.get("verbal_identity", {}) or {}).get("voice_adjectives") or [])[:5],
                "we_sound_like": _shorten((naming.get("verbal_identity", {}) or {}).get("we_sound_like"), 100),
            },
        },
    }


def _execution_inputs(state: GraphState) -> dict:
    """Everything the execution-half report writer needs."""
    unit_econ = state.get("unit_economics", {}) or {}
    compliance = state.get("compliance_claims", {}) or {}
    critique = state.get("critique", {}) or {}
    playbook = state.get("launch_playbook", {}) or {}
    ideation = state.get("product_ideation", {}) or {}
    trends = state.get("trend_research", {}) or {}

    return {
        "brand_brief": _slim_brief(state.get("brand_brief", {}) or {}),
        "product_names": [
            p.get("name") for p in (ideation.get("products") or [])[:8] if p.get("name")
        ],
        "trend_data_quality": trends.get("data_quality"),
        "unit_economics": {
            "lead_product_cogs": unit_econ.get("lead_product_cogs"),
            "pricing_recommendation": unit_econ.get("pricing_recommendation"),
            "revenue_scenarios": unit_econ.get("revenue_scenarios"),
            "fixed_cost_stack": (unit_econ.get("fixed_cost_stack") or [])[:6],
            "break_even": unit_econ.get("break_even"),
            "capital_required": unit_econ.get("capital_required"),
            "unit_economics_commentary": _shorten(unit_econ.get("unit_economics_commentary"), 400),
        },
        "compliance_claims": {
            "products_review": [
                {
                    "product_name": r.get("product_name"),
                    "claims_analysis": [
                        {
                            "claim": _shorten(c.get("claim"), 90),
                            "risk_level": c.get("risk_level"),
                            "rule": _shorten(c.get("rule"), 120),
                            "safer_alternative": _shorten(c.get("safer_alternative"), 90),
                        }
                        for c in (r.get("claims_analysis") or [])[:3]
                    ],
                    "label_essentials": (r.get("label_essentials") or [])[:3],
                }
                for r in (compliance.get("products_review") or [])[:5]
            ],
            "category_landmines": (compliance.get("category_landmines") or [])[:5],
            "certifications_worth_pursuing": (compliance.get("certifications_worth_pursuing") or [])[:4],
            "pre_launch_checklist": (compliance.get("pre_launch_checklist") or [])[:6],
            "overall_regulatory_risk_score": compliance.get("overall_regulatory_risk_score"),
        },
        "critique": {
            "risks": [
                {"category": r.get("category"), "risk": _shorten(r.get("risk"), 130), "mitigation": _shorten(r.get("mitigation"), 130)}
                for r in (critique.get("risks") or [])[:6]
            ],
            "contrarian_bets": (critique.get("contrarian_bets") or [])[:3],
            "tweaks": (critique.get("tweaks") or [])[:6],
            "kill_criteria": (critique.get("kill_criteria") or [])[:4],
        },
        "launch_playbook": {
            "first_30_days": (playbook.get("first_30_days") or [])[:6],
            "days_31_60": (playbook.get("days_31_60") or [])[:5],
            "days_61_90": (playbook.get("days_61_90") or [])[:5],
            "top_gtm_channels": (playbook.get("top_gtm_channels") or [])[:4],
            "content_starter_pack": (playbook.get("content_starter_pack") or [])[:6],
            "kpis_to_track": (playbook.get("kpis_to_track") or [])[:5],
        },
    }


async def report_writer_node(state: GraphState) -> dict:
    """Two-pass writer so each request stays under 8K TPM. Pass A writes the
    opportunity half (sections 0-7); pass B writes the execution half (8-14 +
    appendix). We concatenate markdown and merge sections dicts.
    """
    prompt_a = load_prompt("report_writer_opportunity.md")
    prompt_b = load_prompt("report_writer_execution.md")

    raw_a = await chat_json(prompt_a, compact_json(_opportunity_inputs(state)), max_tokens=4500)
    part_a = ReportOutput.model_validate(raw_a)

    raw_b = await chat_json(prompt_b, compact_json(_execution_inputs(state)), max_tokens=4500)
    part_b = ReportOutput.model_validate(raw_b)

    combined_md = f"{part_a.markdown.rstrip()}\n\n{part_b.markdown.lstrip()}"
    combined_md = _ensure_headings(combined_md)

    combined_sections: dict[str, str] = {}
    combined_sections.update(part_a.sections or {})
    combined_sections.update(part_b.sections or {})

    return {
        "report": {"markdown": combined_md, "sections": combined_sections},
        "events": [event("report_writer", "completed", "Report composed (2 passes)")],
    }
