from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


# All agent output models are intentionally lenient: they define the top-level
# shape but tolerate extra fields and use dict/list/Any for nested structure so
# small variations in LLM output don't fail validation.
class _Lenient(BaseModel):
    model_config = ConfigDict(extra="allow")


class TrendSignal(_Lenient):
    keyword: str
    source: str = ""
    growth_pct: float | None = None
    direction: Literal["rising", "stable", "declining", "unknown"] = "unknown"
    note: str = ""


class TrendResearchOutput(_Lenient):
    signals: list[TrendSignal] = Field(default_factory=list)
    rising_themes: list[str] = Field(default_factory=list)
    declining_signals: list[str] = Field(default_factory=list)
    channel_insights: list[str] = Field(default_factory=list)
    emerging_ingredients: list[str] = Field(default_factory=list)
    cultural_context: str = ""
    data_quality: Literal["live_api", "partial", "llm_estimated"] = "llm_estimated"


class MarketFitOutput(_Lenient):
    icp_description: str
    jobs_to_be_done: list[str] = Field(default_factory=list)
    occasions: list[str] = Field(default_factory=list)
    buying_triggers: list[str] = Field(default_factory=list)
    price_band_usd: str = ""
    willingness_to_pay_rationale: str = ""
    whitespace: list[str] = Field(default_factory=list)
    competitive_landscape: str = ""
    channel_recommendations: list[str] = Field(default_factory=list)


class ProductSuggestion(_Lenient):
    name: str
    description: str = ""
    hook: str = ""
    trend_rationale: str = ""
    confidence: Literal["high", "medium", "low"] = "medium"
    estimated_price_range: str = ""
    format: str = "daily_driver"
    differentiators: list[str] = Field(default_factory=list)


class ProductIdeationOutput(_Lenient):
    products: list[ProductSuggestion] = Field(default_factory=list)


class CritiqueRisk(_Lenient):
    category: str = ""
    risk: str = ""
    mitigation: str = ""


class CritiqueOutput(_Lenient):
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    risks: list[CritiqueRisk] = Field(default_factory=list)
    contrarian_bets: list[str] = Field(default_factory=list)
    tweaks: list[str] = Field(default_factory=list)
    kill_criteria: list[str] = Field(default_factory=list)


class Competitor(_Lenient):
    name: str
    type: Literal["direct", "adjacent", "aspirational"] = "direct"
    positioning: str = ""
    price_band_usd: str = ""
    hero_products: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    channels: list[str] = Field(default_factory=list)
    note: str = ""


class CompetitorDeepDiveOutput(_Lenient):
    competitors: list[Competitor] = Field(default_factory=list)
    five_forces_summary: list[str] = Field(default_factory=list)
    positioning_gaps: list[str] = Field(default_factory=list)
    pricing_map: str = ""


class UnitEconomicsOutput(_Lenient):
    benchmarks_used: list[str] = Field(default_factory=list)
    lead_product_cogs: dict[str, Any] = Field(default_factory=dict)
    pricing_recommendation: dict[str, Any] = Field(default_factory=dict)
    revenue_scenarios: dict[str, Any] = Field(default_factory=dict)
    fixed_cost_stack: list[dict[str, Any]] = Field(default_factory=list)
    break_even: dict[str, Any] = Field(default_factory=dict)
    capital_required: dict[str, Any] = Field(default_factory=dict)
    unit_economics_commentary: str = ""


class NameCandidate(_Lenient):
    name: str
    style: str = ""
    rationale: str = ""
    potential_pitfall: str = ""


class VerbalIdentity(_Lenient):
    voice_adjectives: list[str] = Field(default_factory=list)
    we_sound_like: str = ""
    do_examples: list[str] = Field(default_factory=list)
    dont_examples: list[str] = Field(default_factory=list)


class BrandNamingOutput(_Lenient):
    keep_current_name: bool = True
    keep_current_name_rationale: str = ""
    name_candidates: list[NameCandidate] = Field(default_factory=list)
    taglines: list[str] = Field(default_factory=list)
    verbal_identity: VerbalIdentity = Field(default_factory=VerbalIdentity)
    naming_risks: list[str] = Field(default_factory=list)


class PlaybookAction(_Lenient):
    action: str
    owner: str = ""
    expected_output: str = ""
    est_cost_usd: str = ""


class GtmChannel(_Lenient):
    channel: str
    first_test: str = ""
    budget_usd: str = ""
    success_metric: str = ""


class Partnership(_Lenient):
    partner_type: str
    angle: str = ""
    first_ask: str = ""


class LaunchPlaybookOutput(_Lenient):
    positioning_statement: str = ""
    first_30_days: list[PlaybookAction] = Field(default_factory=list)
    days_31_60: list[PlaybookAction] = Field(default_factory=list)
    days_61_90: list[PlaybookAction] = Field(default_factory=list)
    top_gtm_channels: list[GtmChannel] = Field(default_factory=list)
    content_starter_pack: list[str] = Field(default_factory=list)
    partnership_plays: list[Partnership] = Field(default_factory=list)
    kpis_to_track: list[str] = Field(default_factory=list)
    first_hire: str = ""
    budget_summary: str = ""


class ClaimAnalysis(_Lenient):
    claim: str
    risk_level: Literal["high", "medium", "low"] = "medium"
    rule: str = ""
    substantiation_needed: str = ""
    safer_alternative: str = ""


class ProductComplianceReview(_Lenient):
    product_name: str
    claims_analysis: list[ClaimAnalysis] = Field(default_factory=list)
    label_essentials: list[str] = Field(default_factory=list)
    allergen_concerns: list[str] = Field(default_factory=list)
    additive_flags: list[str] = Field(default_factory=list)


class Certification(_Lenient):
    name: str
    why_it_matters: str = ""
    is_gatekeeper: bool = False


class RegulatoryRiskScore(_Lenient):
    score: int = 3
    rationale: str = ""


class ComplianceClaimsOutput(_Lenient):
    products_review: list[ProductComplianceReview] = Field(default_factory=list)
    category_landmines: list[str] = Field(default_factory=list)
    certifications_worth_pursuing: list[Certification] = Field(default_factory=list)
    pre_launch_checklist: list[str] = Field(default_factory=list)
    overall_regulatory_risk_score: RegulatoryRiskScore = Field(default_factory=RegulatoryRiskScore)


class ReportOutput(_Lenient):
    markdown: str
    sections: dict[str, str] = Field(default_factory=dict)
