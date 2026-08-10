"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BrandLockup } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { streamUrl } from "@/lib/api";
import type { AgentProgressEvent } from "@/lib/types";

const NODES: { key: string; label: string; description: string }[] = [
  { key: "clarifier", label: "Clarifier", description: "Normalizing your brief" },
  { key: "trend_research", label: "Trend Research", description: "Grounded in real web sources" },
  { key: "market_fit", label: "Market Fit", description: "ICP, JTBD, whitespace" },
  { key: "competitor_deep_dive", label: "Competitor Deep Dive", description: "5-8 competitors + Porter's 5 forces" },
  { key: "brand_naming", label: "Brand Naming", description: "Name & tagline candidates" },
  { key: "product_ideation", label: "Product Ideation", description: "8-12 product ideas w/ hooks" },
  { key: "unit_economics", label: "Unit Economics", description: "COGS, pricing, break-even" },
  { key: "compliance_claims", label: "Compliance & Claims", description: "FSSAI/FDA claim safety" },
  { key: "critique", label: "Critique", description: "Devil's-advocate stress test" },
  { key: "launch_playbook", label: "Launch Playbook", description: "30 / 60 / 90 day plan" },
  { key: "report_writer", label: "Report Writer", description: "Editorial synthesis of 16 assets" },
];

type Status = "pending" | "started" | "completed" | "failed";

export function AgentTimeline({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [nodeStatus, setNodeStatus] = useState<Record<string, Status>>({});
  const [events, setEvents] = useState<AgentProgressEvent[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [terminal, setTerminal] = useState<"completed" | "failed" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const start = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const es = new EventSource(streamUrl(sessionId));

    es.addEventListener("progress", (e) => {
      try {
        const evt = JSON.parse((e as MessageEvent).data) as AgentProgressEvent;
        setEvents((prev) => [...prev, evt]);
        if (NODES.some((n) => n.key === evt.node)) {
          setNodeStatus((prev) => ({ ...prev, [evt.node]: evt.status as Status }));
        }
        if (evt.status === "failed") setError(evt.message);
      } catch {}
    });

    es.addEventListener("done", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as { status: string };
        setTerminal(data.status === "failed" ? "failed" : "completed");
      } catch {
        setTerminal("completed");
      }
      es.close();
    });

    es.onerror = () => {};

    return () => es.close();
  }, [sessionId]);

  useEffect(() => {
    if (terminal === "completed") {
      const t = setTimeout(() => router.push(`/report/${sessionId}`), 800);
      return () => clearTimeout(t);
    }
  }, [terminal, router, sessionId]);

  function iconFor(status: Status | undefined) {
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "started":
        return <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--primary))]" />;
      default:
        return <div className="h-2 w-2 rounded-full bg-[hsl(var(--muted-foreground))]" />;
    }
  }

  const completedCount = Object.values(nodeStatus).filter((s) => s === "completed").length;
  const progressPct = (completedCount / NODES.length) * 100;

  // Rough per-node estimate — we've measured full pipelines at 2-3 min.
  const AVG_SEC_PER_NODE = 15;
  const remainingSec = Math.max(
    0,
    (NODES.length - completedCount) * AVG_SEC_PER_NODE - (elapsed % AVG_SEC_PER_NODE),
  );

  function fmt(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-8">
      <nav className="mb-10 flex items-center justify-between">
        <BrandLockup />
        <ThemeToggle />
      </nav>

      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">
            Cooking up your report<span className="text-[hsl(var(--primary))]">…</span>
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            11 specialist agents · {completedCount} of {NODES.length} done
          </p>
        </div>
        <div className="text-right">
          <span className="block text-sm text-[hsl(var(--muted-foreground))]">
            elapsed {fmt(elapsed)}
          </span>
          {!terminal && completedCount > 0 && (
            <span className="block text-xs text-[hsl(var(--muted-foreground))]">
              ~{fmt(remainingSec)} remaining
            </span>
          )}
        </div>
      </div>

      <div className="mb-6">
        <Progress value={progressPct} />
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <ol className="space-y-4">
            {NODES.map((n) => {
              const status = nodeStatus[n.key];
              return (
                <li key={n.key} className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 items-center justify-center">
                    {iconFor(status)}
                  </div>
                  <div>
                    <div
                      className={
                        status === "completed"
                          ? "font-medium text-[hsl(var(--foreground))]"
                          : status === "started"
                          ? "font-medium text-[hsl(var(--primary))]"
                          : "font-medium text-[hsl(var(--muted-foreground))]"
                      }
                    >
                      {n.label}
                    </div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      {n.description}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {events.length > 0 && (
        <details className="mt-6 text-sm text-[hsl(var(--muted-foreground))]">
          <summary className="cursor-pointer">Event log ({events.length})</summary>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {events.slice(-25).map((e, idx) => (
              <li key={idx}>
                <span className="text-[hsl(var(--primary))]">{e.node}</span> · {e.status} · {e.message}
              </li>
            ))}
          </ul>
        </details>
      )}

      {terminal === "failed" && (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-500">
          <p className="font-semibold">Pipeline failed</p>
          {error && <p className="mt-1">{error}</p>}
          <Button className="mt-3" variant="outline" onClick={() => router.push("/")}>
            Start over
          </Button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
        This takes 2-3 minutes. 11 agents run one after another to fit inside the
        free-tier rate limits.
      </p>
    </div>
  );
}
