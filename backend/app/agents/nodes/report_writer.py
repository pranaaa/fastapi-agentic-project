from __future__ import annotations

import re

from app.agents.nodes._helpers import compact_json, event, load_prompt
from app.agents.state import GraphState
from app.services.llm import chat_text

REQUIRED_HEADINGS = [
    "## Executive Summary",
    "## 1. Idea Snapshot",
    "## 2. Target Customer & Occasion",
    "## 3. Trend Signals",
    "## 4. Competitive Landscape",
    "## 5. Recommended Products",
    "## 6. Suggested Tweaks",
    "## Appendix: Data Sources",
]

SECTION_KEY_BY_HEADING_PREFIX = [
    ("## Executive Summary", "executive_summary"),
    ("## 1.", "idea_snapshot"),
    ("## 2.", "target_customer"),
    ("## 3.", "trend_signals"),
    ("## 4.", "competitive_landscape"),
    ("## 5.", "products"),
    ("## 6.", "tweaks"),
    ("## Appendix", "appendix"),
]


def _strip_wrapping_fence(md: str) -> str:
    m = re.match(r"^```(?:markdown)?\s*\n(.*)\n```\s*$", md.strip(), flags=re.DOTALL)
    return m.group(1).strip() if m else md.strip()


def _ensure_headings(md: str) -> str:
    for h in REQUIRED_HEADINGS:
        if h not in md:
            md += f"\n\n{h}\n\n_Not generated in this run._"
    return md


def _parse_sections(md: str) -> dict[str, str]:
    sections: dict[str, str] = {}
    current_key: str | None = None
    current_lines: list[str] = []

    def flush():
        nonlocal current_key, current_lines
        if current_key is not None:
            body = "\n".join(current_lines).strip()
            if body:
                sections[current_key] = body
        current_lines = []

    for line in md.splitlines():
        if line.startswith("## "):
            new_key = None
            for prefix, key in SECTION_KEY_BY_HEADING_PREFIX:
                if line.startswith(prefix):
                    new_key = key
                    break
            flush()
            current_key = new_key
        else:
            if current_key is not None:
                current_lines.append(line)
    flush()
    return sections


def _shorten(s: str | None, n: int) -> str:
    if not s:
        return ""
    s = s.strip()
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"


def _slim_state_for_report(state: GraphState) -> dict:
    brief = state.get("brand_brief", {}) or {}
    trends = state.get("trend_research", {}) or {}
    market = state.get("market_fit", {}) or {}
    competitors = state.get("competitor_deep_dive", {}) or {}
    ideation = state.get("product_ideation", {}) or {}
    critique = state.get("critique", {}) or {}
    return {
        "brand_brief": {
            "brand_name": brief.get("brand_name"),
            "concept": brief.get("concept"),
            "category": brief.get("category"),
            "geography": brief.get("geography"),
            "business_format": brief.get("business_format"),
            "price_tier": brief.get("price_tier"),
            "target_customer_summary": brief.get("target_customer_summary"),
            "hero_products": brief.get("hero_products"),
            "goals": brief.get("goals"),
        },
        "trend_research": {
            "rising_themes": (trends.get("rising_themes") or [])[:5],
            "declining_signals": (trends.get("declining_signals") or [])[:3],
            "channel_insights": (trends.get("channel_insights") or [])[:3],
            "cultural_context": _shorten(trends.get("cultural_context"), 350),
            "signals": [
                {"keyword": s.get("keyword"), "source": s.get("source"), "direction": s.get("direction"), "note": _shorten(s.get("note"), 100)}
                for s in (trends.get("signals") or [])[:7]
            ],
            "data_quality": trends.get("data_quality"),
        },
        "market_fit": {
            "icp_description": _shorten(market.get("icp_description"), 400),
            "jobs_to_be_done": (market.get("jobs_to_be_done") or [])[:3],
            "occasions": (market.get("occasions") or [])[:5],
            "buying_triggers": (market.get("buying_triggers") or [])[:4],
            "price_band_usd": market.get("price_band_usd"),
            "whitespace": (market.get("whitespace") or [])[:4],
        },
        "competitor_deep_dive": {
            "pricing_map": _shorten(competitors.get("pricing_map"), 300),
            "positioning_gaps": (competitors.get("positioning_gaps") or [])[:4],
            "competitors": [
                {
                    "name": c.get("name"),
                    "type": c.get("type"),
                    "positioning": _shorten(c.get("positioning"), 120),
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
                    "description": _shorten(p.get("description"), 180),
                    "hook": _shorten(p.get("hook"), 100),
                    "trend_rationale": _shorten(p.get("trend_rationale"), 130),
                    "confidence": p.get("confidence"),
                    "estimated_price_range": p.get("estimated_price_range"),
                    "format": p.get("format"),
                }
                for p in (ideation.get("products") or [])[:7]
            ]
        },
        "critique": {
            "risks": [
                {"category": r.get("category"), "risk": _shorten(r.get("risk"), 130), "mitigation": _shorten(r.get("mitigation"), 130)}
                for r in (critique.get("risks") or [])[:5]
            ],
            "tweaks": (critique.get("tweaks") or [])[:6],
        },
    }


async def report_writer_node(state: GraphState) -> dict:
    """Single-pass plain-markdown writer for the POC pipeline.

    Uses `chat_text` (no JSON response_format) — the deliverable IS markdown,
    and small models struggle to escape markdown values inside JSON strings.
    """
    prompt = load_prompt("report_writer_opportunity.md")
    md = await chat_text(prompt, compact_json(_slim_state_for_report(state)), max_tokens=4500)
    md = _strip_wrapping_fence(md)
    md = _ensure_headings(md)
    sections = _parse_sections(md)

    return {
        "report": {"markdown": md, "sections": sections},
        "events": [event("report_writer", "completed", "Report composed")],
    }
