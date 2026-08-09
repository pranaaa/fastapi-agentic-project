"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { geographySchema } from "@/lib/validators";

type FormValues = z.infer<typeof geographySchema>;

export function StepGeography({
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
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(geographySchema),
    defaultValues:
      data ?? { city_region: "", business_format: "cafe", format_notes: "" },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="city_region">City or region</Label>
        <Input id="city_region" placeholder="Bangalore, Austin, Berlin…" {...register("city_region")} />
        {errors.city_region && (
          <p className="text-xs text-red-400">{errors.city_region.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="business_format">Business format</Label>
        <Select id="business_format" {...register("business_format")}>
          <option value="cafe">Café</option>
          <option value="restaurant">Restaurant</option>
          <option value="ghost_kitchen">Ghost kitchen</option>
          <option value="retail">Retail / grocery</option>
          <option value="d2c">D2C (online / subscription)</option>
          <option value="catering">Catering</option>
          <option value="other">Other</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="format_notes">Format notes (optional)</Label>
        <Textarea
          id="format_notes"
          placeholder="Kiosk in a co-working lobby, 40-seat brunch spot, cloud kitchen serving 3 delivery brands…"
          {...register("format_notes")}
        />
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
