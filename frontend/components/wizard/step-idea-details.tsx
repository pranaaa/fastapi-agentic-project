"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ideaDetailsSchema } from "@/lib/validators";

type FormValues = z.infer<typeof ideaDetailsSchema>;

function TagInput({
  label,
  helper,
  value,
  onChange,
  max,
  placeholder,
}: {
  label: string;
  helper?: string;
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v) return;
    if (value.includes(v)) return;
    if (max && value.length >= max) return;
    onChange([...value, v]);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {helper && <p className="text-xs text-[hsl(var(--muted-foreground))]">{helper}</p>}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="secondary" onClick={add}>
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-2.5 py-1 text-xs"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== v))}
                className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function StepIdeaDetails({
  data,
  onBack,
  onNext,
}: {
  data?: FormValues;
  onBack: () => void;
  onNext: (d: FormValues) => Promise<void>;
}) {
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(ideaDetailsSchema),
    defaultValues:
      data ?? {
        hero_products: [],
        inspiration_brands: [],
        constraints: [],
        custom_trend_keywords: [],
      },
  });

  const hero = watch("hero_products");
  const inspiration = watch("inspiration_brands");
  const constraints = watch("constraints");
  const keywords = watch("custom_trend_keywords");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <TagInput
        label="Hero products (1-5)"
        helper="The signature items your brand is known for."
        value={hero || []}
        onChange={(v) => setValue("hero_products", v, { shouldValidate: true })}
        max={5}
        placeholder="pour-over bar, cold brew, matcha latte…"
      />
      {errors.hero_products && (
        <p className="text-xs text-red-400">{errors.hero_products.message as string}</p>
      )}

      <TagInput
        label="Inspiration brands (optional)"
        value={inspiration || []}
        onChange={(v) => setValue("inspiration_brands", v)}
        placeholder="Blue Bottle, Blank Street, Sightglass…"
      />

      <TagInput
        label="Constraints (optional)"
        helper="Capital, supply chain, dietary, regulatory…"
        value={constraints || []}
        onChange={(v) => setValue("constraints", v)}
        placeholder="limited capital, no dairy, small kitchen…"
      />

      <TagInput
        label="Custom trend keywords (up to 3, optional)"
        helper="Extra terms to feed the trends agent."
        value={keywords || []}
        onChange={(v) => setValue("custom_trend_keywords", v)}
        max={3}
        placeholder="matcha, gut health, adaptogens…"
      />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Next →
        </Button>
      </div>
    </form>
  );
}
