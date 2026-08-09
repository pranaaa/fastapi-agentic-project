"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownViewer } from "./markdown-viewer";
import { getReport, pdfUrl } from "@/lib/api";
import type { ReportResponse } from "@/lib/types";

const DISCLAIMER =
  "AI-assisted research, not financial or legal advice. Validate trends and regulations locally before investing.";

export function ReportView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await getReport(sessionId);
        if (cancelled) return;
        setReport(r);
        // If pipeline is still running, poll every 3s
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

  function copyMarkdown() {
    if (!report?.markdown) return;
    navigator.clipboard.writeText(report.markdown);
    toast.success("Markdown copied to clipboard");
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-10 text-center">
        <Loader2 className="mb-3 h-6 w-6 animate-spin text-[hsl(var(--primary))]" />
        <p className="text-[hsl(var(--muted-foreground))]">Loading report…</p>
      </div>
    );
  }

  if (err || !report) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-red-400">Failed to load report: {err}</p>
        <Button className="mt-3" onClick={() => router.push("/")}>
          Home
        </Button>
      </div>
    );
  }

  if (report.status === "failed") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-4 text-2xl font-bold">Report generation failed</h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          Something went wrong during the pipeline. Please try again.
        </p>
        <Button className="mt-4" onClick={() => router.push("/")}>
          Start over
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col px-6 py-10">
      <div className="mb-4 rounded-md border border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))]/5 p-3 text-xs text-[hsl(var(--primary))]">
        {DISCLAIMER}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your ideation report</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Session {sessionId.slice(0, 8)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyMarkdown}>
            <Copy className="mr-2 h-4 w-4" />
            Copy MD
          </Button>
          <a
            href={pdfUrl(sessionId)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center rounded-md bg-[hsl(var(--primary))] px-3 text-xs font-medium text-[hsl(var(--primary-foreground))] hover:opacity-90"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </a>
        </div>
      </div>

      <Card>
        <CardContent className="p-8">
          {report.markdown ? (
            <MarkdownViewer markdown={report.markdown} />
          ) : (
            <p className="text-[hsl(var(--muted-foreground))]">Report is empty.</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => router.push("/")}>
          ← Home
        </Button>
        <Button variant="outline" onClick={() => router.push("/ideate?id=" + sessionId)}>
          Edit inputs
        </Button>
      </div>
    </div>
  );
}
