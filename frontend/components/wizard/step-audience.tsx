"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { audienceSchema } from "@/lib/validators";

type FormValues = z.infer<typeof audienceSchema>;

const AGE_BANDS = ["18-24", "25-34", "35-44", "45-54", "55+"];
const DIET_OPTIONS = [
  "vegan",
  "vegetarian",
  "halal",
  "kosher",
  "gluten-free",
  "keto",
  "high-protein",
  "low-sugar",
];

export function StepAudience({
  data,
  onBack,
  onNext,
}: {
  data?: FormValues;
  onBack: () => void;
  onNext: (d: FormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(audienceSchema),
    defaultValues:
      data ?? { age_bands: [], location_type: "urban", dietary_preferences: [] },
  });

  const ageBands = watch("age_bands");
  const diet = watch("dietary_preferences");

  function toggle(field: "age_bands" | "dietary_preferences", value: string) {
    const current = (field === "age_bands" ? ageBands : diet) || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setValue(field, next, { shouldValidate: true });
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-2">
        <Label>Age bands (select all that apply)</Label>
        <div className="flex flex-wrap gap-2">
          {AGE_BANDS.map((age) => {
            const active = ageBands?.includes(age);
            return (
              <button
                key={age}
                type="button"
                onClick={() => toggle("age_bands", age)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  active
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                    : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
                }`}
              >
                {age}
              </button>
            );
          })}
        </div>
        {errors.age_bands && (
          <p className="text-xs text-red-400">{errors.age_bands.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location_type">Location type</Label>
        <Select id="location_type" {...register("location_type")}>
          <option value="urban">Urban</option>
          <option value="suburban">Suburban</option>
          <option value="mixed">Mixed</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Dietary preferences (optional, select any)</Label>
        <div className="flex flex-wrap gap-2">
          {DIET_OPTIONS.map((d) => {
            const active = diet?.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggle("dietary_preferences", d)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  active
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                    : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

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
