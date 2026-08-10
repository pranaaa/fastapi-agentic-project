from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from app.agents.nodes.brand_naming import brand_naming_node
from app.agents.nodes.clarifier import clarifier_node
from app.agents.nodes.competitor_deep_dive import competitor_deep_dive_node
from app.agents.nodes.compliance_claims import compliance_claims_node
from app.agents.nodes.critique import critique_node
from app.agents.nodes.launch_playbook import launch_playbook_node
from app.agents.nodes.market_fit import market_fit_node
from app.agents.nodes.product_ideation import product_ideation_node
from app.agents.nodes.report_writer import report_writer_node
from app.agents.nodes.trend_research import trend_research_node
from app.agents.nodes.unit_economics import unit_economics_node
from app.agents.state import GraphState


def build_graph():
    """Sequential 11-agent pipeline.

    Serial ordering is deliberate: Groq free tier is TPM-bound, and chaining
    lets each call reuse the prior call's shrinking window naturally.

    START → clarifier → trend_research → market_fit → competitor_deep_dive
          → brand_naming → product_ideation → unit_economics
          → compliance_claims → critique → launch_playbook
          → report_writer → END

    compliance_claims runs AFTER product_ideation (needs the products) and
    BEFORE critique (so the critic can factor regulatory risk into gaps/risks).
    """
    g = StateGraph(GraphState)

    for name, fn in [
        ("clarifier", clarifier_node),
        ("trend_research", trend_research_node),
        ("market_fit", market_fit_node),
        ("competitor_deep_dive", competitor_deep_dive_node),
        ("brand_naming", brand_naming_node),
        ("product_ideation", product_ideation_node),
        ("unit_economics", unit_economics_node),
        ("compliance_claims", compliance_claims_node),
        ("critique", critique_node),
        ("launch_playbook", launch_playbook_node),
        ("report_writer", report_writer_node),
    ]:
        g.add_node(name, fn)

    sequence = [
        "clarifier",
        "trend_research",
        "market_fit",
        "competitor_deep_dive",
        "brand_naming",
        "product_ideation",
        "unit_economics",
        "compliance_claims",
        "critique",
        "launch_playbook",
        "report_writer",
    ]

    g.add_edge(START, sequence[0])
    for a, b in zip(sequence, sequence[1:]):
        g.add_edge(a, b)
    g.add_edge(sequence[-1], END)

    return g.compile()
