import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value = 0,
  className,
}: { value?: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--secondary))]",
        className
      )}
    >
      <div
        className="h-full bg-[hsl(var(--primary))] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
