import { Suspense } from "react";
import { CompareView } from "@/components/report/compare-view";

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <CompareView />
    </Suspense>
  );
}
