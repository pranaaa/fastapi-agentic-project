"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLockup } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { MarkdownViewer } from "./markdown-viewer";
import { getReport, getSession, pdfUrl } from "@/lib/api";
import type { ReportResponse, SessionState } from "@/lib/types";
import { cn } from "@/lib/utils";

const SECTIONS: { key: string; title: string }[] = [
  { key: "executive_summary", title: "Executive Summary" },
  { key: "products", title: "Recommended Products" },
  { key: "positioning", title: "Positioning" },
  { key: "unit_economics", title: "Unit Economics" },
  { key: "compliance", title: "Compliance & Claims" },
  { key: "gtm_playbook", title: "Launch Playbook" },
  { key: "risks", title: "Risks & Kill Criteria" },
  { key: "tweaks", title: "Suggested Tweaks" },
  { key: "this_week", title: "This Week" },
];

type Loaded = { session: SessionState; report: ReportResponse };

async function loadPair(id: string): Promise<Loaded> {
  const [session, report] = await Promise.all([getSession(id), getReport(id)]);
  return { session, report };
}

function BrandBadge({ data }: { data: Loaded | null }) {
  if (!data) return null;
  const b = data.session.wizard?.basics;
  return (
    <div>
      <div className="font-serif text-2xl">{b?.brand_name || "Untitled"}</div>
      <div className="text-xs text-[hsl(var(--muted-foreground))]">
        {data.session.wizard?.geography?.city_region} · {data.session.wizard?.pricing?.price_tier} tier
      </div>
    </div>
  );
}

export function CompareView() {
  const router = useRouter();
  const params = useSearchParams();
  const aId = params.get("a") || "";
  const bId = params.get("b") || "";

  const [a, setA] = useState<Loaded | null>(null);
  const [b, setB] = useState<Loaded | null>(null);
  const [bInput, setBInput] = useState(bId);
  const [active, setActive] = useState<string>(SECTIONS[0].key);
  const [loading, setLoading] = useState<boolean>(!!aId || !!bId);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const [la, lb] = await Promise.all([
          aId ? loadPair(aId) : Promise.resolve(null),
          bId ? loadPair(bId) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setA(la);
        setB(lb);
      } catch (e) {
        if (!cancelled) toast.error((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (aId || bId) run();
    return () => {
      cancelled = true;
    };
  }, [aId, bId]);

  function loadB() {
    const id = bInput.trim();
    if (!id) return;
    router.push(`/compare?a=${aId}&b=${id}`);
  }

  const aMd =
    active === "full"
      ? a?.report.markdown || ""
      : a?.report.sections?.[active] || "";
  const bMd =
    active === "full"
      ? b?.report.markdown || ""
      : b?.report.sections?.[active] || "";

  return (
    <div className="mx-auto flex max-w-7xl flex-col px-6 py-8">
      <nav className="mb-8 flex items-center justify-between">
        <BrandLockup />
        <ThemeToggle />
      </nav>

      <div className="mb-6">
        <h1 className="font-serif text-3xl tracking-tight">Compare two runs</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Explore variants side-by-side. Kill the weak. Build the winner.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <BrandBadge data={a} />
            {a && (
              <a
                href={pdfUrl(a.session.id)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[hsl(var(--primary))] hover:underline"
              >
                Download PDF
              </a>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            {b ? (
              <div className="flex items-center justify-between">
                <BrandBadge data={b} />
                <a
                  href={pdfUrl(b.session.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[hsl(var(--primary))] hover:underline"
                >
                  Download PDF
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="cmp-b">Compare against session</Label>
                <div className="flex gap-2">
                  <Input
                    id="cmp-b"
                    placeholder="paste a completed session id…"
                    value={bInput}
                    onChange={(e) => setBInput(e.target.value)}
                  />
                  <Button onClick={loadB} disabled={!bInput.trim()}>
                    Load
                  </Button>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Tip: run the wizard again with tweaked answers, then paste the new
                  session id here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(a || b) && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  active === s.key
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                    : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
                )}
              >
                {s.title}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="px-6 py-8">
                {a ? (
                  aMd ? (
                    <MarkdownViewer markdown={aMd} />
                  ) : (
                    <p className="text-[hsl(var(--muted-foreground))]">
                      No content for this section.
                    </p>
                  )
                ) : (
                  <p className="text-[hsl(var(--muted-foreground))]">
                    Load session A via ?a=…
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-6 py-8">
                {b ? (
                  bMd ? (
                    <MarkdownViewer markdown={bMd} />
                  ) : (
                    <p className="text-[hsl(var(--muted-foreground))]">
                      No content for this section.
                    </p>
                  )
                ) : (
                  <p className="text-[hsl(var(--muted-foreground))]">
                    Load session B from the panel above.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {loading && (
        <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Loading…
        </p>
      )}

      <footer className="mt-12 border-t border-[hsl(var(--border))] pt-6 pb-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
        AI-assisted research, not financial or legal advice.
      </footer>
    </div>
  );
}
