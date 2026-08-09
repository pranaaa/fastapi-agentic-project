"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { streamUrl } from "@/lib/api";
import type { AgentProgressEvent } from "@/lib/types";

const NODES: { key: string; label: string; description: string }[] = [
  { key: "clarifier", label: "Clarifier", description: "Normalizing your brief" },
  { key: "trend_research", label: "Trend Research", description: "Analyzing rising themes" },
  { key: "market_fit", label: "Market Fit", description: "Profiling ICP and whitespace" },
  { key: "product_ideation", label: "Product Ideation", description: "Generating product ideas" },
  { key: "critique", label: "Critique", description: "Reviewing gaps and risks" },
  { key: "report_writer", label: "Report Writer", description: "Composing your report" },
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
      } catch {
        // ignore malformed
      }
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

    es.onerror = () => {
      // If the connection dies before terminal, keep the UI visible so the user can refresh
    };

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

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Cooking up your report…</h1>
        <span className="text-sm text-[hsl(var(--muted-foreground))]">
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
        </span>
      </div>

      <Card>
        <CardContent className="p-6">
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
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          <p className="font-semibold">Pipeline failed</p>
          {error && <p className="mt-1">{error}</p>}
          <Button className="mt-3" variant="outline" onClick={() => router.push("/")}>
            Start over
          </Button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
        This can take 30-90 seconds depending on LLM speed. Don't close the tab.
      </p>
    </div>
  );
}
