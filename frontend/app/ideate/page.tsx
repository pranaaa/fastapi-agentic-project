import { Suspense } from "react";
import { WizardShell } from "@/components/wizard/wizard-shell";

export default function IdeatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <WizardShell />
    </Suspense>
  );
}
