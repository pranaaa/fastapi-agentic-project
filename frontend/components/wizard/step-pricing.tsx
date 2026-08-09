"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { pricingSchema } from "@/lib/validators";

type FormValues = z.infer<typeof pricingSchema>;

const TIERS: { value: FormValues["price_tier"]; label: string; help: string }[] = [
  { value: "budget", label: "Budget", help: "Value-focused, high volume, low margin." },
  { value: "mid", label: "Mid", help: "Balanced pricing, everyday-premium feel." },
  { value: "premium", label: "Premium", help: "Craft, specialty, or luxury positioning." },
];

export function StepPricing({
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
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: data ?? { price_tier: "mid" },
  });

  const selected = watch("price_tier");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-2">
        <Label>Price tier</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {TIERS.map((t) => {
            const active = selected === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setValue("price_tier", t.value)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  active
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                    : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/40"
                }`}
              >
                <div className={`font-semibold ${active ? "text-[hsl(var(--primary))]" : ""}`}>
                  {t.label}
                </div>
                <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{t.help}</div>
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
