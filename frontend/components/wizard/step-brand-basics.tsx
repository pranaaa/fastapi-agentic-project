"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { basicsSchema } from "@/lib/validators";

type FormValues = z.infer<typeof basicsSchema>;

const CATEGORY_SUGGESTIONS = [
  "specialty coffee",
  "bubble tea",
  "ghost kitchen",
  "meal prep",
  "RTD beverage",
  "bakery",
  "fast casual",
];

export function StepBrandBasics({
  data,
  onNext,
}: {
  data?: FormValues;
  onNext: (data: FormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(basicsSchema),
    defaultValues: data ?? { brand_name: "", one_line_concept: "", category: "" },
  });

  const category = watch("category");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="brand_name">Brand name</Label>
        <Input id="brand_name" placeholder="e.g. Grounded Coffee Co." {...register("brand_name")} />
        {errors.brand_name && (
          <p className="text-xs text-red-400">{errors.brand_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="one_line_concept">One-line concept</Label>
        <Textarea
          id="one_line_concept"
          placeholder="Third-wave coffee with Indian single-origin focus"
          {...register("one_line_concept")}
        />
        {errors.one_line_concept && (
          <p className="text-xs text-red-400">{errors.one_line_concept.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          placeholder="specialty coffee, bubble tea, ghost kitchen…"
          {...register("category")}
        />
        <div className="flex flex-wrap gap-2 pt-1">
          {CATEGORY_SUGGESTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue("category", c, { shouldValidate: true })}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                category === c
                  ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                  : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {errors.category && (
          <p className="text-xs text-red-400">{errors.category.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          Next →
        </Button>
      </div>
    </form>
  );
}
