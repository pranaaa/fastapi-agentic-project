"use client";

import { Button } from "@/components/ui/button";
import type { WizardData } from "@/lib/types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b border-[hsl(var(--border))] py-2 text-sm last:border-b-0">
      <div className="text-[hsl(var(--muted-foreground))]">{label}</div>
      <div className="col-span-2">{value || <span className="text-[hsl(var(--muted-foreground))]">—</span>}</div>
    </div>
  );
}

function Section({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (s: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <button
          onClick={() => onEdit(step)}
          className="text-xs text-[hsl(var(--primary))] hover:underline"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

export function StepReview({
  wizard,
  onBack,
  onEdit,
  onGenerate,
  loading,
}: {
  wizard: WizardData;
  onBack: () => void;
  onEdit: (step: number) => void;
  onGenerate: () => void;
  loading?: boolean;
}) {
  const b = wizard.basics;
  const a = wizard.audience;
  const g = wizard.geography;
  const p = wizard.pricing;
  const i = wizard.idea_details;
  const goals = wizard.goals;

  const missing: string[] = [];
  if (!b) missing.push("Brand basics");
  if (!a) missing.push("Audience");
  if (!g) missing.push("Geography");
  if (!p) missing.push("Pricing");
  if (!i) missing.push("Idea details");
  if (!goals) missing.push("Goals");

  return (
    <div className="space-y-5">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Review your brief. When you're ready, the pipeline runs six specialized agents to
        generate your report.
      </p>

      <Section title="1. Brand basics" step={1} onEdit={onEdit}>
        <Field label="Brand name" value={b?.brand_name} />
        <Field label="One-line concept" value={b?.one_line_concept} />
        <Field label="Category" value={b?.category} />
      </Section>

      <Section title="2. Audience" step={2} onEdit={onEdit}>
        <Field label="Age bands" value={a?.age_bands?.join(", ")} />
        <Field label="Location type" value={a?.location_type} />
        <Field
          label="Dietary preferences"
          value={a?.dietary_preferences?.length ? a.dietary_preferences.join(", ") : ""}
        />
      </Section>

      <Section title="3. Geography & format" step={3} onEdit={onEdit}>
        <Field label="City / region" value={g?.city_region} />
        <Field label="Business format" value={g?.business_format} />
        <Field label="Notes" value={g?.format_notes} />
      </Section>

      <Section title="4. Pricing" step={4} onEdit={onEdit}>
        <Field label="Price tier" value={p?.price_tier} />
      </Section>

      <Section title="5. Idea details" step={5} onEdit={onEdit}>
        <Field label="Hero products" value={i?.hero_products?.join(", ")} />
        <Field label="Inspiration brands" value={i?.inspiration_brands?.join(", ")} />
        <Field label="Constraints" value={i?.constraints?.join(", ")} />
        <Field label="Custom trend keywords" value={i?.custom_trend_keywords?.join(", ")} />
      </Section>

      <Section title="6. Goals" step={6} onEdit={onEdit}>
        <Field label="Launch timeline" value={goals?.launch_timeline} />
        <Field label="Primary goal" value={goals?.primary_goal} />
      </Section>

      {missing.length > 0 && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          Missing: {missing.join(", ")}. Please complete these steps.
        </p>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onGenerate} disabled={loading || missing.length > 0}>
          {loading ? "Starting…" : "Generate report →"}
        </Button>
      </div>
    </div>
  );
}
