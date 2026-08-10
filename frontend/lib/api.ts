import type { ReportResponse, SessionState } from "./types";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export async function createSession(): Promise<{ id: string }> {
  return json(
    await fetch(`${API}/api/v1/sessions`, { method: "POST" })
  );
}

export async function patchSession(
  id: string,
  step: number,
  data: unknown
): Promise<SessionState> {
  return json(
    await fetch(`${API}/api/v1/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step, data }),
    })
  );
}

const STEP_ORDER = [
  "basics",
  "audience",
  "geography",
  "pricing",
  "idea_details",
  "goals",
];

export async function seedWizard(
  id: string,
  wizard: Record<string, unknown>,
): Promise<void> {
  for (let i = 0; i < STEP_ORDER.length; i++) {
    const key = STEP_ORDER[i];
    const data = wizard[key];
    if (!data) continue;
    await patchSession(id, i + 1, data);
  }
}

export async function getSession(id: string): Promise<SessionState> {
  return json(await fetch(`${API}/api/v1/sessions/${id}`));
}

export async function runPipeline(id: string): Promise<{ status: string }> {
  return json(
    await fetch(`${API}/api/v1/sessions/${id}/run`, { method: "POST" })
  );
}

export async function getReport(id: string): Promise<ReportResponse> {
  return json(await fetch(`${API}/api/v1/sessions/${id}/report`));
}

export function streamUrl(id: string): string {
  return `${API}/api/v1/sessions/${id}/stream`;
}

export function pdfUrl(id: string, section?: string): string {
  const base = `${API}/api/v1/sessions/${id}/export/pdf`;
  return section ? `${base}?section=${encodeURIComponent(section)}` : base;
}
