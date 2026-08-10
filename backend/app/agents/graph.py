from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from app.agents.nodes.clarifier import clarifier_node
from app.agents.nodes.competitor_deep_dive import competitor_deep_dive_node
from app.agents.nodes.critique import critique_node
from app.agents.nodes.market_fit import market_fit_node
from app.agents.nodes.product_ideation import product_ideation_node
from app.agents.nodes.report_writer import report_writer_node
from app.agents.nodes.trend_research import trend_research_node
from app.agents.state import GraphState


def build_graph():
    """POC pipeline — 7 agents, sequential.

    Trimmed down from 11 (dropped: brand_naming, unit_economics, compliance_claims,
    launch_playbook) so the free-tier budget covers 5-8 reports/day comfortably.
    The dropped nodes are still available in the codebase — flip them back into
    the sequence and the report writer prompt to re-enable.

    START → clarifier → trend_research → market_fit → competitor_deep_dive
          → product_ideation → critique → report_writer → END
    """
    g = StateGraph(GraphState)

    for name, fn in [
        ("clarifier", clarifier_node),
        ("trend_research", trend_research_node),
        ("market_fit", market_fit_node),
        ("competitor_deep_dive", competitor_deep_dive_node),
        ("product_ideation", product_ideation_node),
        ("critique", critique_node),
        ("report_writer", report_writer_node),
    ]:
        g.add_node(name, fn)

    sequence = [
        "clarifier",
        "trend_research",
        "market_fit",
        "competitor_deep_dive",
        "product_ideation",
        "critique",
        "report_writer",
    ]

    g.add_edge(START, sequence[0])
    for a, b in zip(sequence, sequence[1:]):
        g.add_edge(a, b)
    g.add_edge(sequence[-1], END)

    return g.compile()
