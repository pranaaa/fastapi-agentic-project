"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sparkles,
  TrendingUp,
  Coffee,
  FileText,
  Zap,
  BadgeCheck,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrandLockup, Mascot } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { createSession, seedWizard } from "@/lib/api";
import { EXAMPLES } from "@/lib/examples";

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Grounded in real signals",
    body: "Trend research pulls live web sources (Tavily) and pairs them with category knowledge — no vibes, no fabricated numbers.",
  },
  {
    icon: Zap,
    title: "11-agent pipeline",
    body: "Specialist agents for trends, market fit, competitors, naming, unit economics, compliance, critique and a 90-day launch playbook.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance-aware",
    body: "Every claim on your menu is checked against FSSAI / FDA / EFSA rules with a safer alternative offered where risk is high.",
  },
  {
    icon: FileText,
    title: "Assets, not advice",
    body: "16 downloadable deliverables you can hand to your chef, lab, investor, or manufacturer. Each one exports as its own PDF.",
  },
];

const PIPELINE_STOPS = [
  "Clarifier",
  "Trends",
  "Market Fit",
  "Competitors",
  "Naming",
  "Products",
  "Unit Economics",
  "Compliance",
  "Critique",
  "Playbook",
  "Report",
];

const DELIVERABLES = [
  "Executive Summary",
  "Idea Snapshot",
  "Target Customer & JTBD",
  "Trend Signals + Sources",
  "Competitive Landscape",
  "Recommended Products",
  "Positioning Statement",
  "Naming & Taglines",
  "Unit Economics",
  "Compliance & Claims Review",
  "30 / 60 / 90 Playbook",
  "Risks & Kill Criteria",
  "Suggested Tweaks",
  "Contrarian Bets",
  "What To Do This Week",
  "Data Sources & Methodology",
];

export default function LandingPage() {
  const router = useRouter();
  const [starting, setStarting] = useState<null | "blank" | string>(null);

  async function startBlank() {
    setStarting("blank");
    try {
      const { id } = await createSession();
      router.push(`/ideate?id=${id}`);
    } catch (e) {
      toast.error(`Could not start a session. ${(e as Error).message}`);
      setStarting(null);
    }
  }

  async function startFromExample(slug: string) {
    const ex = EXAMPLES.find((e) => e.slug === slug);
    if (!ex) return;
    setStarting(slug);
    try {
      const { id } = await createSession();
      await seedWizard(id, ex.data as unknown as Record<string, unknown>);
      // Land on the review step so they can inspect and hit "Generate report"
      router.push(`/ideate?id=${id}&step=7`);
    } catch (e) {
      toast.error(`Could not seed example. ${(e as Error).message}`);
      setStarting(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
      <nav className="flex items-center justify-between">
        <BrandLockup tagline="Guess less. Build once." />
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-6 text-sm text-[hsl(var(--muted-foreground))] sm:flex">
            <a href="#try" className="hover:text-[hsl(var(--foreground))]">
              Try an example
            </a>
            <a href="#how" className="hover:text-[hsl(var(--foreground))]">
              How it works
            </a>
            <a href="#deliverables" className="hover:text-[hsl(var(--foreground))]">
              Deliverables
            </a>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <section className="mt-20 flex flex-col items-center text-center sm:mt-28">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-xs text-[hsl(var(--muted-foreground))]">
          <Sparkles className="h-3 w-3 text-[hsl(var(--primary))]" />
          A strategy team for F&B founders — packed into 2 minutes
        </span>
        <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">
          You don't get advice.{" "}
          <span className="italic text-[hsl(var(--primary))]">You get assets.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[hsl(var(--muted-foreground))]">
          Menu Muse runs an eleven-agent pipeline on your idea and returns sixteen
          founder-grade deliverables: trend signals, competitor map, product ideas,
          unit economics, compliance review, and a 90-day launch playbook. Free.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button size="lg" disabled={!!starting} onClick={startBlank}>
            {starting === "blank" ? "Starting…" : "Build my brand →"}
          </Button>
          <a
            href="#try"
            className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            or try an example
          </a>
        </div>
        <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
          No signup · 7-step wizard · ~2 minutes to your first report
        </p>
      </section>

      {/* Quick-start examples — great for demos to non-technical users */}
      <section id="try" className="mt-24">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl">Try an example</h2>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            Pre-fills the wizard → jump straight to the report
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.slug}
              onClick={() => startFromExample(ex.slug)}
              disabled={!!starting}
              className="group text-left"
            >
              <Card className="h-full p-6 transition-colors hover:border-[hsl(var(--primary))]/40 disabled:opacity-50">
                <div className="mb-3 text-3xl">{ex.emoji}</div>
                <h3 className="font-serif text-lg">{ex.headline}</h3>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  {ex.subtitle}
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-xs text-[hsl(var(--primary))]">
                  {starting === ex.slug ? "Loading…" : "Try this one"}
                  {starting !== ex.slug && (
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  )}
                </div>
              </Card>
            </button>
          ))}
        </div>
      </section>

      <section id="how" className="mt-24">
        <Card className="p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <Coffee className="h-4 w-4 text-[hsl(var(--primary))]" />
            <h2 className="text-sm font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              The pipeline
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {PIPELINE_STOPS.map((stop, i) => (
              <div key={stop} className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 ${
                    i === PIPELINE_STOPS.length - 1
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
                  }`}
                >
                  {stop}
                </span>
                {i < PIPELINE_STOPS.length - 1 && (
                  <span className="text-[hsl(var(--muted-foreground))]">→</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <Card key={f.title} className="p-6">
            <f.icon className="mb-3 h-5 w-5 text-[hsl(var(--primary))]" />
            <h3 className="font-serif text-xl">{f.title}</h3>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{f.body}</p>
          </Card>
        ))}
      </section>

      <section id="deliverables" className="mt-16">
        <Card className="overflow-hidden p-8">
          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-8">
            <Mascot size={72} />
            <div>
              <h2 className="font-serif text-3xl">
                Every report ships 16 deliverables
              </h2>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Tabbed on screen. Individually downloadable as PDFs. Made to hand to
                your chef, your lab, your investor, or your manufacturer.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-3">
                {DELIVERABLES.map((s) => (
                  <div key={s} className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--primary))]" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { k: "Fast because it's AI", v: "60-second wizard, ~2 min pipeline" },
          {
            k: "Trusted because it isn't only AI",
            v: "Named frameworks, source citations, no fabricated numbers",
          },
          {
            k: "Free because it should be",
            v: "Open-source Llama 3.1 + GPT-OSS 120B on Groq, Vercel + Render hosting",
          },
        ].map((row) => (
          <Card key={row.k} className="p-6">
            <p className="font-serif text-lg">{row.k}</p>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{row.v}</p>
          </Card>
        ))}
      </section>

      <footer className="mt-auto pt-16 pb-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
        © Menu Muse · AI-assisted research, not financial or legal advice. Validate
        trends and regulations locally before investing.
      </footer>
    </main>
  );
}
