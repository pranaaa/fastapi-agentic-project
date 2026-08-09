"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { goalsSchema } from "@/lib/validators";

type FormValues = z.infer<typeof goalsSchema>;

export function StepGoals({
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
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(goalsSchema),
    defaultValues: data ?? { launch_timeline: "3-6_months", primary_goal: "validate_idea" },
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="launch_timeline">Launch timeline</Label>
        <Select id="launch_timeline" {...register("launch_timeline")}>
          <option value="0-3_months">0-3 months</option>
          <option value="3-6_months">3-6 months</option>
          <option value="6-12_months">6-12 months</option>
          <option value="exploring">Just exploring</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="primary_goal">Primary goal for this report</Label>
        <Select id="primary_goal" {...register("primary_goal")}>
          <option value="validate_idea">Validate the idea</option>
          <option value="expand_menu">Expand the menu</option>
          <option value="rebrand">Rebrand / reposition</option>
          <option value="find_niche">Find a niche</option>
          <option value="investor_pitch">Prep an investor pitch</option>
        </Select>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Review →
        </Button>
      </div>
    </form>
  );
}
