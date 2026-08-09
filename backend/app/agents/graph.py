from __future__ import annotations

from langgraph.graph import END, START, StateGraph

from app.agents.nodes.clarifier import clarifier_node
from app.agents.nodes.critique import critique_node
from app.agents.nodes.market_fit import market_fit_node
from app.agents.nodes.product_ideation import product_ideation_node
from app.agents.nodes.report_writer import report_writer_node
from app.agents.nodes.trend_research import trend_research_node
from app.agents.state import GraphState


def build_graph():
    g = StateGraph(GraphState)
    g.add_node("clarifier", clarifier_node)
    g.add_node("trend_research", trend_research_node)
    g.add_node("market_fit", market_fit_node)
    g.add_node("product_ideation", product_ideation_node)
    g.add_node("critique", critique_node)
    g.add_node("report_writer", report_writer_node)

    g.add_edge(START, "clarifier")
    # Fan-out
    g.add_edge("clarifier", "trend_research")
    g.add_edge("clarifier", "market_fit")
    # Fan-in: LangGraph waits for both edges into product_ideation
    g.add_edge("trend_research", "product_ideation")
    g.add_edge("market_fit", "product_ideation")
    g.add_edge("product_ideation", "critique")
    g.add_edge("critique", "report_writer")
    g.add_edge("report_writer", END)

    return g.compile()
