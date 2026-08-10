import type { WizardData } from "./types";

export interface Example {
  slug: string;
  emoji: string;
  headline: string;
  subtitle: string;
  data: Required<Omit<WizardData, "review">>;
}

export const EXAMPLES: Example[] = [
  {
    slug: "coffee-bar",
    emoji: "☕",
    headline: "Specialty coffee bar",
    subtitle: "Bangalore · premium · Indian single-origin",
    data: {
      basics: {
        brand_name: "Grounded",
        one_line_concept:
          "Third-wave specialty coffee bar focused on Indian single-origin beans",
        category: "specialty coffee",
      },
      audience: {
        age_bands: ["25-34", "35-44"],
        location_type: "urban",
        dietary_preferences: ["vegan"],
      },
      geography: {
        city_region: "Bangalore",
        business_format: "cafe",
        format_notes: "40-seat cafe in a creative district",
      },
      pricing: { price_tier: "premium" },
      idea_details: {
        hero_products: ["pour over bar", "cold brew", "coffee subscription"],
        inspiration_brands: ["Blue Bottle", "Blank Street"],
        constraints: ["limited capital"],
        custom_trend_keywords: ["matcha", "adaptogens"],
      },
      goals: { launch_timeline: "3-6_months", primary_goal: "validate_idea" },
    },
  },
  {
    slug: "protein-snack",
    emoji: "🥜",
    headline: "D2C protein snack",
    subtitle: "US suburban · mid tier · high-protein",
    data: {
      basics: {
        brand_name: "Grit Bites",
        one_line_concept:
          "High-protein savory snacks for gym-goers who don't want another sweet bar",
        category: "high-protein snacks",
      },
      audience: {
        age_bands: ["25-34", "35-44"],
        location_type: "suburban",
        dietary_preferences: ["high-protein", "low-sugar"],
      },
      geography: {
        city_region: "Austin, Texas",
        business_format: "d2c",
        format_notes: "DTC subscription + Amazon + regional grocery",
      },
      pricing: { price_tier: "mid" },
      idea_details: {
        hero_products: ["lentil chips", "beef biltong bites", "chickpea puffs"],
        inspiration_brands: ["Chomps", "Rx Bar"],
        constraints: ["small production run", "gluten-free supply chain"],
        custom_trend_keywords: ["clean label", "high protein"],
      },
      goals: { launch_timeline: "6-12_months", primary_goal: "find_niche" },
    },
  },
  {
    slug: "kombucha",
    emoji: "🫖",
    headline: "RTD gut-health kombucha",
    subtitle: "Exploring · budget · retail",
    data: {
      basics: {
        brand_name: "Culture Kompany",
        one_line_concept:
          "Affordable gut-health kombucha built for everyday grocery shelves, not health stores",
        category: "RTD kombucha",
      },
      audience: {
        age_bands: ["18-24", "25-34"],
        location_type: "mixed",
        dietary_preferences: ["vegan", "gluten-free"],
      },
      geography: {
        city_region: "Los Angeles",
        business_format: "retail",
        format_notes: "regional grocery retail, target 300 SKUs in year one",
      },
      pricing: { price_tier: "budget" },
      idea_details: {
        hero_products: ["ginger kombucha", "mango kombucha", "hibiscus kombucha"],
        inspiration_brands: ["GT's", "Health-Ade"],
        constraints: ["limited capital", "cold-chain distribution"],
        custom_trend_keywords: ["prebiotic soda", "functional beverage"],
      },
      goals: { launch_timeline: "exploring", primary_goal: "validate_idea" },
    },
  },
];
