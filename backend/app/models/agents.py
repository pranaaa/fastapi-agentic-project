from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class TrendSignal(BaseModel):
    keyword: str
    source: str
    growth_pct: float | None = None
    direction: Literal["rising", "stable", "declining", "unknown"] = "unknown"
    note: str = ""


class TrendResearchOutput(BaseModel):
    signals: list[TrendSignal] = Field(default_factory=list)
    rising_themes: list[str] = Field(default_factory=list)
    channel_insights: list[str] = Field(default_factory=list)
    data_quality: Literal["live_api", "partial", "llm_estimated"] = "llm_estimated"


class MarketFitOutput(BaseModel):
    icp_description: str
    occasions: list[str] = Field(default_factory=list)
    price_band_usd: str
    whitespace: list[str] = Field(default_factory=list)
    competitive_landscape: str


class ProductSuggestion(BaseModel):
    name: str
    description: str
    trend_rationale: str
    confidence: Literal["high", "medium", "low"] = "medium"
    estimated_price_range: str


class ProductIdeationOutput(BaseModel):
    products: list[ProductSuggestion] = Field(default_factory=list)


class CritiqueOutput(BaseModel):
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    tweaks: list[str] = Field(default_factory=list)


class ReportOutput(BaseModel):
    markdown: str
    sections: dict[str, str] = Field(default_factory=dict)
