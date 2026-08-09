from __future__ import annotations

import json

from app.agents.nodes._helpers import event, load_prompt
from app.agents.state import GraphState
from app.models.agents import ReportOutput
from app.services.llm import chat_json

REQUIRED_HEADINGS = [
    "## 1. Idea Snapshot",
    "## 2. Target Customer & Occasion",
    "## 3. Trend Signals",
    "## 4. Recommended Products",
    "## 5. Positioning & Differentiation",
    "## 6. Go-to-Market Angles",
    "## 7. Risks & Open Questions",
    "## 8. Suggested Tweaks",
    "## Appendix: Data Sources",
]


def _ensure_headings(md: str) -> str:
    """Append any missing required H2 sections as placeholders rather than failing."""
    for h in REQUIRED_HEADINGS:
        if h not in md:
            md += f"\n\n{h}\n\n_Not generated in this run._"
    return md


async def report_writer_node(state: GraphState) -> dict:
    prompt = load_prompt("report_writer.md")
    user = json.dumps(
        {
            "brand_brief": state.get("brand_brief", {}),
            "trend_research": state.get("trend_research", {}),
            "market_fit": state.get("market_fit", {}),
            "product_ideation": state.get("product_ideation", {}),
            "critique": state.get("critique", {}),
        },
        default=str,
    )
    raw = await chat_json(prompt, user)
    parsed = ReportOutput.model_validate(raw)
    parsed.markdown = _ensure_headings(parsed.markdown)
    return {
        "report": parsed.model_dump(),
        "events": [event("report_writer", "completed", "Report generated")],
    }
