export type PriceTier = "budget" | "mid" | "premium";
export type BusinessFormat =
  | "cafe"
  | "restaurant"
  | "ghost_kitchen"
  | "retail"
  | "d2c"
  | "catering"
  | "other";
export type LaunchTimeline =
  | "0-3_months"
  | "3-6_months"
  | "6-12_months"
  | "exploring";
export type PrimaryGoal =
  | "validate_idea"
  | "expand_menu"
  | "rebrand"
  | "find_niche"
  | "investor_pitch";

export interface WizardData {
  basics?: { brand_name: string; one_line_concept: string; category: string };
  audience?: {
    age_bands: string[];
    location_type: "urban" | "suburban" | "mixed";
    dietary_preferences: string[];
  };
  geography?: {
    city_region: string;
    business_format: BusinessFormat;
    format_notes: string;
  };
  pricing?: { price_tier: PriceTier };
  idea_details?: {
    hero_products: string[];
    inspiration_brands: string[];
    constraints: string[];
    custom_trend_keywords: string[];
  };
  goals?: { launch_timeline: LaunchTimeline; primary_goal: PrimaryGoal };
}

export type SessionStatus =
  | "draft"
  | "queued"
  | "running"
  | "completed"
  | "failed";

export interface SessionState {
  id: string;
  status: SessionStatus;
  wizard: WizardData;
  progress_events: AgentProgressEvent[];
  error_message: string | null;
}

export interface AgentProgressEvent {
  node: string;
  status: "started" | "completed" | "failed";
  message: string;
  timestamp: string;
}

export interface ReportResponse {
  session_id: string;
  status: SessionStatus;
  markdown: string | null;
  sections: Record<string, string> | null;
  disclaimer: string;
}
