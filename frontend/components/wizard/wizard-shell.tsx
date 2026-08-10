"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSession, patchSession, runPipeline } from "@/lib/api";
import type { WizardData } from "@/lib/types";
import { StepBrandBasics } from "./step-brand-basics";
import { StepAudience } from "./step-audience";
import { StepGeography } from "./step-geography";
import { StepPricing } from "./step-pricing";
import { StepIdeaDetails } from "./step-idea-details";
import { StepGoals } from "./step-goals";
import { StepReview } from "./step-review";
import { BrandLockup } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

const STEP_TITLES = [
  "Brand basics",
  "Audience",
  "Geography & format",
  "Pricing",
  "Idea details",
  "Goals & timeline",
  "Review & generate",
];

export function WizardShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const initialStep = Math.max(1, Math.min(7, Number(searchParams.get("step")) || 1));

  const [step, setStep] = useState(initialStep);
  const [wizard, setWizard] = useState<WizardData>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getSession(id)
      .then((s) => setWizard(s.wizard || {}))
      .catch((e) => toast.error(`Load failed: ${e.message}`));
  }, [id]);

  const progress = useMemo(() => (step / 7) * 100, [step]);

  if (!id) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-[hsl(var(--muted-foreground))]">
          No session id. Go back to the home page.
        </p>
        <Button className="mt-4" onClick={() => router.push("/")}>
          Home
        </Button>
      </div>
    );
  }

  async function persistStep(stepNumber: number, data: unknown) {
    if (!id) return;
    setLoading(true);
    try {
      const s = await patchSession(id, stepNumber, data as object);
      setWizard(s.wizard || {});
    } catch (e) {
      toast.error(`Save failed: ${(e as Error).message}`);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!id) return;
    setLoading(true);
    try {
      await runPipeline(id);
      router.push(`/ideate/${id}/processing`);
    } catch (e) {
      toast.error((e as Error).message);
      setLoading(false);
    }
  }

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <StepBrandBasics
            data={wizard.basics}
            onNext={async (d) => {
              await persistStep(1, d);
              setStep(2);
            }}
          />
        );
      case 2:
        return (
          <StepAudience
            data={wizard.audience}
            onBack={() => setStep(1)}
            onNext={async (d) => {
              await persistStep(2, d);
              setStep(3);
            }}
          />
        );
      case 3:
        return (
          <StepGeography
            data={wizard.geography}
            onBack={() => setStep(2)}
            onNext={async (d) => {
              await persistStep(3, d);
              setStep(4);
            }}
          />
        );
      case 4:
        return (
          <StepPricing
            data={wizard.pricing}
            onBack={() => setStep(3)}
            onNext={async (d) => {
              await persistStep(4, d);
              setStep(5);
            }}
          />
        );
      case 5:
        return (
          <StepIdeaDetails
            data={wizard.idea_details}
            onBack={() => setStep(4)}
            onNext={async (d) => {
              await persistStep(5, d);
              setStep(6);
            }}
          />
        );
      case 6:
        return (
          <StepGoals
            data={wizard.goals}
            onBack={() => setStep(5)}
            onNext={async (d) => {
              await persistStep(6, d);
              setStep(7);
            }}
          />
        );
      case 7:
        return (
          <StepReview
            wizard={wizard}
            onBack={() => setStep(6)}
            onEdit={(s) => setStep(s)}
            onGenerate={handleGenerate}
            loading={loading}
          />
        );
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-8">
      <nav className="mb-10 flex items-center justify-between">
        <BrandLockup />
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            ← Home
          </button>
          <ThemeToggle />
        </div>
      </nav>

      <div className="mb-6 space-y-3">
        <div className="flex items-baseline justify-between">
          <h1 className="font-serif text-3xl tracking-tight">
            {STEP_TITLES[step - 1]}
          </h1>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            Step {step} of 7
          </span>
        </div>
        <Progress value={progress} />
      </div>

      <Card>
        <CardContent className="p-8">{renderStep()}</CardContent>
      </Card>
    </div>
  );
}
