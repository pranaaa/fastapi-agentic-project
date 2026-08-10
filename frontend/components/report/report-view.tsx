"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Copy,
  Download,
  FileText,
  Link2,
  Printer,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLockup, Mascot } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { MarkdownViewer } from "./markdown-viewer";
import { getReport, getSession, pdfUrl } from "@/lib/api";
import type { ReportResponse, SessionState } from "@/lib/types";
import { cn } from "@/lib/utils";

const DISCLAIMER =
  "AI-assisted research, not financial or legal advice. Validate trends and regulations locally before investing.";

type Deliverable = {
  key: string;
  title: string;
  hint: string;
};

const DELIVERABLES: Deliverable[] = [
  { key: "executive_summary", title: "Executive Summary", hint: "The lead-with-this page" },
  { key: "idea_snapshot", title: "Idea Snapshot", hint: "Sharpened concept + why now" },
  { key: "target_customer", title: "Target Customer & JTBD", hint: "ICP, persona, occasions" },
  { key: "trend_signals", title: "Trend Signals", hint: "Rising themes + sources" },
  { key: "competitive_landscape", title: "Competitive Landscape", hint: "5-7 competitors + Porter's 5" },
  { key: "products", title: "Recommended Products", hint: "8-12 ideas with hooks" },
  { key: "positioning", title: "Positioning", hint: "Statement + differentiators" },
  { key: "brand_naming", title: "Naming & Voice", hint: "Names, taglines, brand voice" },
  { key: "unit_economics", title: "Unit Economics", hint: "COGS, break-even, capital" },
  { key: "compliance", title: "Compliance & Claims", hint: "Regulatory risk + safer wording" },
  { key: "gtm_playbook", title: "Launch Playbook", hint: "30 / 60 / 90 day plan" },
  { key: "risks", title: "Risks & Kill Criteria", hint: "What could go wrong" },
  { key: "tweaks", title: "Suggested Tweaks", hint: "Improve the original idea" },
  { key: "contrarian_bets", title: "Contrarian Bets", hint: "Non-obvious upside plays" },
  { key: "this_week", title: "This Week", hint: "Next 7-day action list" },
  { key: "appendix", title: "Sources & Methodology", hint: "How the report was built" },
];

export function ReportView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState<string>("full");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [r, s] = await Promise.all([getReport(sessionId), getSession(sessionId)]);
        if (cancelled) return;
        setReport(r);
        setSession(s);
        if (r.status !== "completed" && r.status !== "failed") {
          setTimeout(load, 3000);
          return;
        }
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setErr((e as Error).message);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const brandName = session?.wizard?.basics?.brand_name || "Your brand";
  const concept = session?.wizard?.basics?.one_line_concept || "";
  const geography = session?.wizard?.geography?.city_region;
  const format = session?.wizard?.geography?.business_format;
  const priceTier = session?.wizard?.pricing?.price_tier;

  const availableDeliverables = useMemo(() => {
    const sections = report?.sections || {};
    return DELIVERABLES.filter((d) => (sections[d.key] || "").trim().length > 0);
  }, [report]);

  const activeMarkdown = useMemo(() => {
    if (!report) return "";
    if (active === "full") return report.markdown || "";
    const body = report.sections?.[active] || "";
    const title = DELIVERABLES.find((d) => d.key === active)?.title || "";
    if (!body) return "_Not available in this run._";
    return `## ${title}\n\n${body}`;
  }, [active, report]);

  function copyContent() {
    if (!activeMarkdown) return;
    navigator.clipboard.writeText(activeMarkdown);
    toast.success("Markdown copied to clipboard");
  }

  function print() {
    window.print();
  }

  function copyLink() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    toast.success("Report link copied — anyone with the link can view this");
  }

  const downloadHref =
    active === "full" ? pdfUrl(sessionId) : pdfUrl(sessionId, active);

  const activeTitle =
    active === "full"
      ? "Full report"
      : DELIVERABLES.find((d) => d.key === active)?.title || "Full report";

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col px-6 py-8">
        <nav className="mb-8 flex items-center justify-between">
          <BrandLockup />
          <ThemeToggle />
        </nav>
        <Card className="mb-8 animate-pulse">
          <CardContent className="p-8">
            <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-8">
              <div className="h-16 w-16 rounded-full bg-[hsl(var(--muted))]" />
              <div className="space-y-3">
                <div className="h-3 w-32 rounded bg-[hsl(var(--muted))]" />
                <div className="h-8 w-3/4 rounded bg-[hsl(var(--muted))]" />
                <div className="h-4 w-2/3 rounded bg-[hsl(var(--muted))]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <Card className="animate-pulse">
            <CardContent className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-8 rounded bg-[hsl(var(--muted))]" />
              ))}
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardContent className="space-y-3 p-8">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 rounded bg-[hsl(var(--muted))]"
                  style={{ width: `${60 + (i % 4) * 10}%` }}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (err || !report) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
        <Mascot size={64} />
        <h1 className="mt-4 font-serif text-2xl">Couldn't load this report</h1>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          {err || "The session isn't ready yet, or the API isn't reachable."}
        </p>
        <div className="mt-6 flex gap-2">
          <Button onClick={() => window.location.reload()}>Try again</Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            Go home
          </Button>
        </div>
      </div>
    );
  }

  if (report.status === "failed") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
        <Mascot size={64} />
        <h1 className="mt-4 font-serif text-2xl">Report generation failed</h1>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Something went wrong during the pipeline. This usually means the daily
          model budget was exhausted, or the wizard was incomplete.
        </p>
        <div className="mt-6 flex gap-2">
          <Button onClick={() => router.push("/")}>Start over</Button>
          <Button
            variant="outline"
            onClick={() => router.push("/ideate?id=" + sessionId)}
          >
            Edit inputs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col px-6 py-8">
      <nav className="no-print mb-8 flex flex-wrap items-center justify-between gap-3">
        <BrandLockup />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Link2 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Share link</span>
            <span className="sm:hidden">Share</span>
          </Button>
          <Button variant="outline" size="sm" onClick={print} className="hidden sm:inline-flex">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={copyContent} className="hidden sm:inline-flex">
            <Copy className="mr-2 h-4 w-4" />
            Copy MD
          </Button>
          <a
            href={downloadHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center rounded-md bg-[hsl(var(--primary))] px-3 text-xs font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90"
          >
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">
              {active === "full" ? "Download full PDF" : "Download this PDF"}
            </span>
            <span className="sm:hidden">PDF</span>
          </a>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero card */}
      <Card className="mb-8 overflow-hidden">
        <CardContent className="p-8 sm:p-10">
          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-8">
            <Mascot size={72} />
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2.5 py-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                <Sparkles className="h-3 w-3 text-[hsl(var(--primary))]" />
                Ideation Report
              </div>
              <h1 className="font-serif text-4xl leading-tight tracking-tight">
                {brandName}
              </h1>
              {concept && (
                <p className="mt-3 max-w-2xl text-lg text-[hsl(var(--muted-foreground))]">
                  {concept}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {geography && (
                  <span className="rounded-full bg-[hsl(var(--secondary))] px-2.5 py-1 text-[hsl(var(--secondary-foreground))]">
                    {geography}
                  </span>
                )}
                {format && (
                  <span className="rounded-full bg-[hsl(var(--secondary))] px-2.5 py-1 text-[hsl(var(--secondary-foreground))]">
                    {format.replace("_", " ")}
                  </span>
                )}
                {priceTier && (
                  <span className="rounded-full bg-[hsl(var(--secondary))] px-2.5 py-1 text-[hsl(var(--secondary-foreground))]">
                    {priceTier} tier
                  </span>
                )}
                <span className="rounded-full border border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/10 px-2.5 py-1 text-[hsl(var(--primary))]">
                  {availableDeliverables.length} deliverables
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile deliverables picker (dropdown) */}
      <div className="no-print mb-4 lg:hidden">
        <button
          onClick={() => setMobileNavOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
        >
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[hsl(var(--primary))]" />
            {activeTitle}
          </span>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {mobileNavOpen ? "Close" : "Choose deliverable"}
          </span>
        </button>
        {mobileNavOpen && (
          <Card className="mt-2">
            <CardContent className="max-h-[50vh] overflow-y-auto p-3">
              <button
                onClick={() => {
                  setActive("full");
                  setMobileNavOpen(false);
                }}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm",
                  active === "full"
                    ? "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]"
                    : "hover:bg-[hsl(var(--secondary))]",
                )}
              >
                Full report
              </button>
              {availableDeliverables.map((d) => (
                <button
                  key={d.key}
                  onClick={() => {
                    setActive(d.key);
                    setMobileNavOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm",
                    active === d.key
                      ? "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]"
                      : "hover:bg-[hsl(var(--secondary))]",
                  )}
                >
                  {d.title}
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabbed deliverables view */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="no-print hidden lg:sticky lg:top-6 lg:block lg:self-start">
          <Card>
            <CardContent className="p-3">
              <p className="mb-2 px-3 pt-2 text-xs font-medium uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                Deliverables
              </p>
              <button
                onClick={() => setActive("full")}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                  active === "full"
                    ? "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]",
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4" />
                  Full report
                </div>
                <div className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                  Everything, in one page
                </div>
              </button>
              <div className="my-2 h-px bg-[hsl(var(--border))]" />
              <div className="max-h-[560px] overflow-y-auto pr-1">
                {availableDeliverables.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setActive(d.key)}
                    className={cn(
                      "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                      active === d.key
                        ? "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]"
                        : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]",
                    )}
                  >
                    <div className="font-medium">{d.title}</div>
                    <div className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                      {d.hint}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>

        <div>
          <Card>
            <CardContent className="px-6 py-10 sm:px-12 sm:py-14">
              {activeMarkdown ? (
                <MarkdownViewer markdown={activeMarkdown} />
              ) : (
                <p className="text-[hsl(var(--muted-foreground))]">
                  This deliverable was not generated in this run.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="no-print mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push("/")}>
                ← Home
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/ideate?id=" + sessionId)}
              >
                Edit inputs
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/compare?a=" + sessionId)}
              >
                Compare
              </Button>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Viewing · {activeTitle}
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-12 border-t border-[hsl(var(--border))] pt-6 pb-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
        {DISCLAIMER}
      </footer>
    </div>
  );
}
