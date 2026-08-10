from __future__ import annotations

from app.agents.nodes._helpers import compact_json, event, load_prompt
from app.agents.state import GraphState
from app.config import settings
from app.models.agents import TrendResearchOutput
from app.services.llm import chat_json
from app.services.tavily import search_trends as tavily_search
from app.services.trends import fetch_signals_for_keywords


async def trend_research_node(state: GraphState) -> dict:
    brief = state.get("brand_brief") or {}
    keywords = (brief.get("trend_keywords") or [])[:5]

    # 1. Try Tavily (real web search) first — best signal.
    tavily_signals, tavily_quality = await tavily_search(keywords)

    # 2. Fall back to Trends MCP if configured (legacy).
    mcp_signals, mcp_quality = ([], "llm_estimated")
    if tavily_quality == "llm_estimated":
        mcp_signals, mcp_quality = await fetch_signals_for_keywords(keywords)

    # Prefer whichever gave us live data.
    signals = tavily_signals or mcp_signals
    data_quality_hint = tavily_quality if tavily_signals else mcp_quality

    prompt = load_prompt("trend_research.md")
    user = compact_json(
        {
            "brand_brief": brief,
            "trend_signals": signals,
            "data_quality_hint": data_quality_hint,
            "signal_source": "tavily_web_search" if tavily_signals else ("trends_mcp" if mcp_signals else "none"),
        }
    )
    # Summarization + light analysis on top of Tavily data — route to the light model.
    raw = await chat_json(prompt, user, model=settings.llm_model_light)
    parsed = TrendResearchOutput.model_validate(raw)

    # If we got real data, override the LLM's self-assessment.
    if tavily_signals or mcp_signals:
        parsed.data_quality = data_quality_hint  # type: ignore[assignment]

    n_sources = sum(len(s.get("sources", [])) for s in tavily_signals)
    msg = f"Trends analyzed ({parsed.data_quality})"
    if tavily_signals:
        msg = f"Trends grounded in {n_sources} web sources"

    return {
        "trend_research": parsed.model_dump(),
        "events": [event("trend_research", "completed", msg)],
    }
