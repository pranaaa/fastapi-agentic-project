"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSession } from "@/lib/api";
import { Sparkles, TrendingUp, FileText, Zap } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  async function start() {
    setStarting(true);
    try {
      const { id } = await createSession();
      router.push(`/ideate?id=${id}`);
    } catch (e) {
      toast.error(
        `Could not start a session. Is the API running? ${(e as Error).message}`
      );
      setStarting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-12">
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="inline-block h-3 w-3 rounded-full bg-[hsl(var(--primary))]" />
          F&B Ideation
        </div>
      </nav>

      <section className="mt-24 flex flex-col items-center text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs text-[hsl(var(--muted-foreground))]">
          <Sparkles className="h-3 w-3 text-[hsl(var(--primary))]" />
          AI-powered brand ideation for F&B founders
        </span>
        <h1 className="mt-2 max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
          Ideate your F&B brand{" "}
          <span className="text-[hsl(var(--primary))]">with AI.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[hsl(var(--muted-foreground))]">
          Trend-backed product ideas, positioning insights, and a full brand
          report — generated in minutes by a pipeline of specialized agents.
        </p>
        <Button size="lg" className="mt-8" disabled={starting} onClick={start}>
          {starting ? "Starting…" : "Start ideating →"}
        </Button>
        <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
          No signup, no credit card. 7-step wizard.
        </p>
      </section>

      <section className="mt-24 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: <TrendingUp className="h-5 w-5 text-[hsl(var(--primary))]" />,
            title: "Real trend signals",
            body: "Optional Trends MCP integration surfaces rising themes from Google, TikTok, Amazon, and Reddit.",
          },
          {
            icon: <Zap className="h-5 w-5 text-[hsl(var(--primary))]" />,
            title: "Multi-agent pipeline",
            body: "6 specialized agents (Clarifier → Trends ∥ Market Fit → Ideation → Critique → Report) collaborate on your brief.",
          },
          {
            icon: <FileText className="h-5 w-5 text-[hsl(var(--primary))]" />,
            title: "Ready-to-share report",
            body: "9-section markdown brief with product suggestions, risks, and tweaks. Export to PDF.",
          },
        ].map((f) => (
          <Card key={f.title} className="p-6">
            <div className="mb-3">{f.icon}</div>
            <h3 className="text-base font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              {f.body}
            </p>
          </Card>
        ))}
      </section>

      <footer className="mt-auto pt-16 text-center text-xs text-[hsl(var(--muted-foreground))]">
        AI-assisted research, not financial or legal advice. Validate trends and
        regulations locally before investing.
      </footer>
    </main>
  );
}
