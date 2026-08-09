from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


PriceTier = Literal["budget", "mid", "premium"]
BusinessFormat = Literal[
    "cafe", "restaurant", "ghost_kitchen", "retail", "d2c", "catering", "other"
]
LaunchTimeline = Literal["0-3_months", "3-6_months", "6-12_months", "exploring"]
PrimaryGoal = Literal["validate_idea", "expand_menu", "rebrand", "find_niche", "investor_pitch"]


class BrandBasics(BaseModel):
    brand_name: str = Field(min_length=1, max_length=120)
    one_line_concept: str = Field(min_length=10, max_length=300)
    category: str = Field(min_length=2, max_length=80)


class Audience(BaseModel):
    age_bands: list[str] = Field(min_length=1)
    location_type: Literal["urban", "suburban", "mixed"]
    dietary_preferences: list[str] = Field(default_factory=list)


class GeographyFormat(BaseModel):
    city_region: str = Field(min_length=2, max_length=120)
    business_format: BusinessFormat
    format_notes: str = ""


class Pricing(BaseModel):
    price_tier: PriceTier


class IdeaDetails(BaseModel):
    hero_products: list[str] = Field(min_length=1, max_length=5)
    inspiration_brands: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    custom_trend_keywords: list[str] = Field(default_factory=list, max_length=3)


class Goals(BaseModel):
    launch_timeline: LaunchTimeline
    primary_goal: PrimaryGoal


class WizardPayload(BaseModel):
    basics: BrandBasics | None = None
    audience: Audience | None = None
    geography: GeographyFormat | None = None
    pricing: Pricing | None = None
    idea_details: IdeaDetails | None = None
    goals: Goals | None = None


class BrandBrief(BaseModel):
    brand_name: str
    concept: str
    category: str
    target_customer_summary: str
    geography: str
    business_format: str
    price_tier: str
    hero_products: list[str]
    inspiration_brands: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    goals: str
    trend_keywords: list[str] = Field(default_factory=list)
