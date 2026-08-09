import { z } from "zod";

export const basicsSchema = z.object({
  brand_name: z.string().min(1, "Required").max(120),
  one_line_concept: z
    .string()
    .min(10, "Give us a bit more detail (10+ chars)")
    .max(300),
  category: z.string().min(2).max(80),
});

export const audienceSchema = z.object({
  age_bands: z.array(z.string()).min(1, "Pick at least one age band"),
  location_type: z.enum(["urban", "suburban", "mixed"]),
  dietary_preferences: z.array(z.string()),
});

export const geographySchema = z.object({
  city_region: z.string().min(2).max(120),
  business_format: z.enum([
    "cafe",
    "restaurant",
    "ghost_kitchen",
    "retail",
    "d2c",
    "catering",
    "other",
  ]),
  format_notes: z.string(),
});

export const pricingSchema = z.object({
  price_tier: z.enum(["budget", "mid", "premium"]),
});

export const ideaDetailsSchema = z.object({
  hero_products: z.array(z.string().min(1)).min(1).max(5),
  inspiration_brands: z.array(z.string()),
  constraints: z.array(z.string()),
  custom_trend_keywords: z.array(z.string()).max(3),
});

export const goalsSchema = z.object({
  launch_timeline: z.enum([
    "0-3_months",
    "3-6_months",
    "6-12_months",
    "exploring",
  ]),
  primary_goal: z.enum([
    "validate_idea",
    "expand_menu",
    "rebrand",
    "find_niche",
    "investor_pitch",
  ]),
});
