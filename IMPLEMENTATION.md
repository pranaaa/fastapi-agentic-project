# F&B Brand Ideation Platform — Autonomous Implementation Spec

> **Purpose:** Hand this file to a Cursor/Claude agent session. The agent should implement the full MVP with minimal user involvement. Default all ambiguous decisions using the tables below — do not ask the user unless blocked by missing secrets (e.g. `TRENDS_MCP_API_KEY`).

---

## Agent execution instructions

1. **Project root:** `/Users/pprabhala/Projects/fb-ideation` (or create `~/Projects/fb-ideation` if missing).
2. **Call `move_agent_to_root`** to this path before writing code.
3. **Work phase-by-phase** (Phase 0 → 5). Do not skip verification gates.
4. **Commit only when the user asks.** Initialize git at project start.
5. **Default decisions** are binding — see [Decision defaults](#decision-defaults-no-user-input-needed).
6. **Do not add** auth, billing, Redis, Postgres, or Kubernetes in MVP.
7. **Run tests/smoke checks** at end of each phase before proceeding.

---

## Product summary

Web app for F&B founders: complete a 7-step wizard → multi-agent AI pipeline runs → structured ideation report with trend-backed product suggestions and tweaks to their original idea.

**MVP includes:** wizard, agent pipeline, report viewer, PDF export, dark UI.  
**MVP excludes:** user accounts, payments, admin panel, chat UI.

---

## Decision defaults (no user input needed)

| Decision | Default |
|----------|---------|
| Project name | `fb-ideation` |
| LLM runtime | Ollama (OpenAI-compatible `/v1`) |
| Default model | `qwen2.5:7b` via `ollama pull qwen2.5:7b` |
| Fallback model if Qwen fails | `llama3.1:8b` |
| Agent framework | LangGraph |
| LLM client | `openai` Python SDK pointed at Ollama |
| Database | SQLite + SQLAlchemy 2.0 async |
| Frontend | Next.js 15 App Router + shadcn/ui + next-themes (dark default) |
| Accent color | Amber (`--primary` in zinc dark theme) |
| Trend API | Trends MCP REST (optional; degrade gracefully without key) |
| PDF library | `markdown` + `weasyprint` on backend |
| Package manager (Python) | `uv` or `pip` + `pyproject.toml` |
| Package manager (JS) | `pnpm` (fallback: `npm`) |

---

## Architecture

```
┌─────────────────┐     REST/SSE      ┌──────────────────┐
│  Next.js (web)  │ ◄──────────────► │  FastAPI (api)   │
│  dark shadcn UI │                   │  LangGraph agents│
└─────────────────┘                   └────────┬─────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
              ┌──────────┐            ┌─────────────┐           ┌─────────────┐
              │  SQLite  │            │   Ollama    │           │ Trends MCP  │
              │ sessions │            │ qwen2.5:7b  │           │  (optional) │
              └──────────┘            └─────────────┘           └─────────────┘
```

### LangGraph flow

```
START → clarifier → [trend_research ∥ market_fit] → product_ideation → critique → report_writer → END
```

- `trend_research` and `market_fit` run in parallel after `clarifier`.
- Each node writes JSON to graph state; only `report_writer` emits markdown.
- On JSON parse failure: retry once with `"Return valid JSON only."` appended to prompt.

---

## Repository structure (create exactly this)

```
fb-ideation/
├── IMPLEMENTATION.md          # this file
├── README.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       ├── health.py
│   │   │       └── sessions.py
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── graph.py
│   │   │   ├── state.py
│   │   │   ├── nodes/
│   │   │   │   ├── clarifier.py
│   │   │   │   ├── trend_research.py
│   │   │   │   ├── market_fit.py
│   │   │   │   ├── product_ideation.py
│   │   │   │   ├── critique.py
│   │   │   │   └── report_writer.py
│   │   │   └── prompts/
│   │   │       ├── clarifier.md
│   │   │       ├── trend_research.md
│   │   │       ├── market_fit.md
│   │   │       ├── product_ideation.md
│   │   │       ├── critique.md
│   │   │       └── report_writer.md
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── brand.py
│   │   │   ├── agents.py
│   │   │   └── session.py
│   │   ├── services/
│   │   │   ├── llm.py
│   │   │   ├── trends.py
│   │   │   ├── pdf.py
│   │   │   └── pipeline.py
│   │   └── db/
│   │       ├── __init__.py
│   │       ├── base.py
│   │       ├── models.py
│   │       └── repository.py
│   └── tests/
│       ├── test_health.py
│       ├── test_sessions.py
│       └── test_report_schema.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── components.json          # shadcn
    ├── tailwind.config.ts
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── globals.css
    │   ├── ideate/
    │   │   ├── page.tsx
    │   │   └── [id]/
    │   │       └── processing/
    │   │           └── page.tsx
    │   └── report/
    │       └── [id]/
    │           └── page.tsx
    ├── components/
    │   ├── theme-provider.tsx
    │   ├── wizard/
    │   │   ├── wizard-shell.tsx
    │   │   ├── step-brand-basics.tsx
    │   │   ├── step-audience.tsx
    │   │   ├── step-geography.tsx
    │   │   ├── step-pricing.tsx
    │   │   ├── step-idea-details.tsx
    │   │   ├── step-goals.tsx
    │   │   └── step-review.tsx
    │   ├── report/
    │   │   ├── report-tabs.tsx
    │   │   └── markdown-viewer.tsx
    │   ├── processing/
    │   │   └── agent-timeline.tsx
    │   └── ui/                  # shadcn components
    └── lib/
        ├── api.ts
        ├── types.ts
        └── validators.ts
```

---

## Environment variables

Create `.env.example`:

```bash
# Backend
DATABASE_URL=sqlite+aiosqlite:///./data/app.db
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=qwen2.5:7b
LLM_TIMEOUT_SECONDS=120
TRENDS_MCP_API_KEY=                    # optional; leave empty for LLM-only trends
TRENDS_MCP_BASE_URL=https://api.trendsmcp.ai/api
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_RUN_PER_HOUR=10

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Docker Compose overrides:
- `LLM_BASE_URL=http://ollama:11434/v1`
- `NEXT_PUBLIC_API_URL=http://localhost:8000`

---

## Phase 0 — Bootstrap (verification gate: health + Ollama ping)

### Commands

```bash
cd ~/Projects/fb-ideation

# Backend deps (pyproject.toml)
# fastapi, uvicorn[standard], sqlalchemy[asyncio], aiosqlite,
# pydantic-settings, httpx, openai, langgraph, langchain-core,
# weasyprint, markdown, python-multipart, pytest, pytest-asyncio

# Frontend
pnpm create next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd frontend && pnpm dlx shadcn@latest init -d
pnpm dlx shadcn@latest add button card input label textarea select tabs progress badge accordion separator toast sonner
pnpm add next-themes react-markdown remark-gfm zod react-hook-form @hookform/resolvers lucide-react

# Ollama model (host machine, not in container for Mac dev)
ollama pull qwen2.5:7b
```

### docker-compose.yml

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    # GPU optional; comment out for CPU-only VPS

  api:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite+aiosqlite:///./data/app.db
      - LLM_BASE_URL=http://ollama:11434/v1
      - LLM_MODEL=qwen2.5:7b
      - CORS_ORIGINS=http://localhost:3000
    volumes:
      - ./backend:/app
      - api_data:/app/data
    depends_on:
      - ollama

  web:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - api

volumes:
  ollama_data:
  api_data:
```

### backend/app/config.py pattern

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data/app.db"
    llm_base_url: str = "http://localhost:11434/v1"
    llm_model: str = "qwen2.5:7b"
    llm_timeout_seconds: int = 120
    trends_mcp_api_key: str = ""
    trends_mcp_base_url: str = "https://api.trendsmcp.ai/api"
    cors_origins: str = "http://localhost:3000"
    rate_limit_run_per_hour: int = 10

    class Config:
        env_file = ".env"

settings = Settings()
```

### backend/app/services/llm.py pattern

```python
from openai import AsyncOpenAI
from app.config import settings

client = AsyncOpenAI(
    base_url=settings.llm_base_url,
    api_key="ollama",  # required but unused by Ollama
    timeout=settings.llm_timeout_seconds,
)

async def chat_json(system: str, user: str, retries: int = 1) -> str:
    """Call LLM; expect raw JSON string in response."""
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
    for attempt in range(retries + 1):
        resp = await client.chat.completions.create(
            model=settings.llm_model,
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        content = resp.choices[0].message.content or ""
        if content.strip():
            return content
        if attempt < retries:
            messages.append({"role": "user", "content": "Return valid JSON only."})
    raise ValueError("Empty LLM response")
```

**Gate:** `curl http://localhost:8000/api/v1/health` returns `{"status":"ok","llm":"ok"}` after probing Ollama.

---

## Phase 1 — Data models & session API

### Pydantic models (`backend/app/models/`)

#### brand.py — wizard payload

```python
from pydantic import BaseModel, Field
from typing import Literal

PriceTier = Literal["budget", "mid", "premium"]
BusinessFormat = Literal["cafe", "restaurant", "ghost_kitchen", "retail", "d2c", "catering", "other"]
LaunchTimeline = Literal["0-3_months", "3-6_months", "6-12_months", "exploring"]
PrimaryGoal = Literal["validate_idea", "expand_menu", "rebrand", "find_niche", "investor_pitch"]

class BrandBasics(BaseModel):
    brand_name: str = Field(min_length=1, max_length=120)
    one_line_concept: str = Field(min_length=10, max_length=300)
    category: str = Field(min_length=2, max_length=80)  # e.g. "specialty coffee", "RTD kombucha"

class Audience(BaseModel):
    age_bands: list[str] = Field(min_length=1)  # ["25-34", "35-44"]
    location_type: Literal["urban", "suburban", "mixed"]
    dietary_preferences: list[str] = []  # vegan, halal, gluten-free, etc.

class GeographyFormat(BaseModel):
    city_region: str = Field(min_length=2, max_length=120)
    business_format: BusinessFormat
    format_notes: str = ""

class Pricing(BaseModel):
    price_tier: PriceTier

class IdeaDetails(BaseModel):
    hero_products: list[str] = Field(min_length=1, max_length=5)
    inspiration_brands: list[str] = []
    constraints: list[str] = []  # capital, dietary, supply chain
    custom_trend_keywords: list[str] = Field(default_factory=list, max_length=3)

class Goals(BaseModel):
    launch_timeline: LaunchTimeline
    primary_goal: PrimaryGoal

class WizardPayload(BaseModel):
    basics: BrandBasics | None = None
    audience: Audience | None = None
    geography: GeographyFormat | None = None
    pricing: Pricing | None = None
    idea_details: IdeaDetails | None = None
    goals: Goals | None = None
```

#### brand.py — normalized brief (Clarifier output)

```python
class BrandBrief(BaseModel):
    brand_name: str
    concept: str
    category: str
    target_customer_summary: str
    geography: str
    business_format: str
    price_tier: str
    hero_products: list[str]
    inspiration_brands: list[str]
    constraints: list[str]
    goals: str
    trend_keywords: list[str]  # derived + custom
```

#### agents.py — intermediate agent outputs

```python
class TrendSignal(BaseModel):
    keyword: str
    source: str
    growth_pct: float | None = None
    direction: Literal["rising", "stable", "declining", "unknown"]
    note: str

class TrendResearchOutput(BaseModel):
    signals: list[TrendSignal]
    rising_themes: list[str]
    channel_insights: list[str]
    data_quality: Literal["live_api", "partial", "llm_estimated"]

class MarketFitOutput(BaseModel):
    icp_description: str
    occasions: list[str]
    price_band_usd: str
    whitespace: list[str]
    competitive_landscape: str

class ProductSuggestion(BaseModel):
    name: str
    description: str
    trend_rationale: str
    confidence: Literal["high", "medium", "low"]
    estimated_price_range: str

class ProductIdeationOutput(BaseModel):
    products: list[ProductSuggestion]

class CritiqueOutput(BaseModel):
    strengths: list[str]
    gaps: list[str]
    risks: list[str]
    tweaks: list[str]  # 3-5 concrete tweaks

class ReportOutput(BaseModel):
    markdown: str
    sections: dict[str, str]  # keyed by section slug
```

#### session.py

```python
from enum import Enum
from datetime import datetime
from pydantic import BaseModel
from uuid import UUID

class SessionStatus(str, Enum):
    draft = "draft"
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"

class SessionCreateResponse(BaseModel):
    id: UUID

class SessionPatchRequest(BaseModel):
    step: int  # 1-7
    data: dict  # partial wizard step payload

class AgentProgressEvent(BaseModel):
    node: str
    status: Literal["started", "completed", "failed"]
    message: str
    timestamp: datetime

class ReportResponse(BaseModel):
    session_id: UUID
    status: SessionStatus
    markdown: str | None
    sections: dict[str, str] | None
    disclaimer: str = "AI-assisted research, not financial or legal advice. Validate trends and regulations locally before investing."
```

### SQLAlchemy model (`backend/app/db/models.py`)

```python
# Table: sessions
# - id: UUID PK
# - status: str
# - wizard_json: JSON (WizardPayload serialized)
# - brand_brief_json: JSON nullable
# - agent_outputs_json: JSON nullable  # stores each node output
# - report_markdown: TEXT nullable
# - report_sections_json: JSON nullable
# - progress_events_json: JSON list
# - error_message: TEXT nullable
# - created_at, updated_at: datetime
# - client_ip: str nullable (for rate limit)

# Table: trend_cache
# - id: autoincrement
# - keyword: str indexed
# - sources: str
# - response_json: JSON
# - fetched_at: datetime
```

### API routes (`backend/app/api/routes/sessions.py`)

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/v1/sessions` | — | `{ "id": "uuid" }` |
| PATCH | `/api/v1/sessions/{id}` | `{ "step": 1, "data": {...} }` | updated wizard |
| GET | `/api/v1/sessions/{id}` | — | full session state |
| POST | `/api/v1/sessions/{id}/run` | — | `{ "status": "queued" }` |
| GET | `/api/v1/sessions/{id}/stream` | — | SSE stream |
| GET | `/api/v1/sessions/{id}/report` | — | `ReportResponse` |
| GET | `/api/v1/sessions/{id}/export/pdf` | — | `application/pdf` |

**PATCH merge logic:** merge `data` into the correct wizard step key based on `step` number (1→basics, 2→audience, etc.).

**POST /run:** validate all 7 steps present; set status `queued`; kick off background task running LangGraph.

**SSE format:**

```
event: progress
data: {"node":"clarifier","status":"completed","message":"Brand brief normalized"}

event: done
data: {"status":"completed"}
```

**Gate:** pytest passes for create → patch all steps → get session.

---

## Phase 2 — LangGraph pipeline

### Graph state (`backend/app/agents/state.py`)

```python
from typing import TypedDict, Any

class GraphState(TypedDict, total=False):
    session_id: str
    wizard: dict
    brand_brief: dict
    trend_research: dict
    market_fit: dict
    product_ideation: dict
    critique: dict
    report: dict
    events: list[dict]
    error: str | None
```

### graph.py skeleton

```python
from langgraph.graph import StateGraph, START, END

def build_graph():
    g = StateGraph(GraphState)
    g.add_node("clarifier", clarifier_node)
    g.add_node("trend_research", trend_research_node)
    g.add_node("market_fit", market_fit_node)
    g.add_node("product_ideation", product_ideation_node)
    g.add_node("critique", critique_node)
    g.add_node("report_writer", report_writer_node)

    g.add_edge(START, "clarifier")
    g.add_edge("clarifier", "trend_research")
    g.add_edge("clarifier", "market_fit")
    g.add_edge("trend_research", "product_ideation")
    g.add_edge("market_fit", "product_ideation")
    g.add_edge("product_ideation", "critique")
    g.add_edge("critique", "report_writer")
    g.add_edge("report_writer", END)
    return g.compile()
```

Use a **barrier pattern** for parallel nodes: both `trend_research` and `market_fit` must complete before `product_ideation`. Implement via LangGraph fan-in or a small `wait_for_both` reducer checking keys exist in state.

### Node implementation pattern (each node file)

```python
async def clarifier_node(state: GraphState) -> GraphState:
    prompt = load_prompt("clarifier.md")
    user = json.dumps(state["wizard"])
    raw = await chat_json(prompt, user)
    parsed = BrandBrief.model_validate_json(raw)
    state["brand_brief"] = parsed.model_dump()
    state["events"] = state.get("events", []) + [event("clarifier", "completed", "...")]
    return state
```

Append progress events after each node; persist to DB in `pipeline.py`.

### Prompt templates (store in `agents/prompts/*.md`)

Each prompt must include:
1. Role definition
2. Exact JSON schema (copy from Pydantic model)
3. Rules: no fabricated statistics; distinguish inference vs data
4. F&B domain context

#### clarifier.md (essential content)

```
You normalize F&B founder wizard answers into a BrandBrief JSON object.
Derive 3-5 trend_keywords from category + hero_products + custom_trend_keywords.
Do not invent facts not present in the input.
Return JSON matching this schema: { ... BrandBrief fields ... }
```

#### trend_research.md

```
You analyze trend_signals provided in the user message (from live API or empty).
If trend_signals is empty, set data_quality to "llm_estimated" and base rising_themes on category knowledge — mark direction as "unknown" where no data.
Never invent growth_pct numbers; use null if unknown.
Return TrendResearchOutput JSON.
```

#### report_writer.md

```
Write a markdown report with EXACTLY these H2 sections in order:
## 1. Idea Snapshot
## 2. Target Customer & Occasion
## 3. Trend Signals (with sources)
## 4. Recommended Products / Menu Lines
## 5. Positioning & Differentiation
## 6. Go-to-Market Angles
## 7. Risks & Open Questions
## 8. Suggested Tweaks to Your Original Idea
## Appendix: Data Sources

Use inputs from prior agent JSON only. Include confidence labels on products.
Return JSON: { "markdown": "...", "sections": { "idea_snapshot": "...", ... } }
```

### pipeline.py — background runner

```python
async def run_pipeline(session_id: str, graph, repo):
    await repo.set_status(session_id, "running")
    try:
        session = await repo.get(session_id)
        final_state = await graph.ainvoke({"session_id": session_id, "wizard": session.wizard_json, "events": []})
        await repo.save_outputs(session_id, final_state)
        await repo.set_status(session_id, "completed")
    except Exception as e:
        await repo.set_status(session_id, "failed", str(e))
```

Compile graph once in FastAPI lifespan:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.graph = build_graph()
    await init_db()
    yield
```

**Gate:** Run pipeline on mock wizard JSON; report has all 8 sections.

---

## Phase 3 — Trends MCP integration

### services/trends.py

```python
async def fetch_growth(keyword: str, sources: list[str]) -> dict:
    """
    POST to TRENDS_MCP_BASE_URL
    Headers: Authorization: Bearer {TRENDS_MCP_API_KEY}
    Body: {
      "mode": "get_growth",
      "source": "google search, tiktok, amazon",
      "keyword": keyword,
      "percent_growth": ["3M", "12M"]
    }
    Check trend_cache table first (24h TTL).
    """
```

### trend_research node logic

1. Read `brand_brief.trend_keywords` (max 5 keywords to conserve quota).
2. If `TRENDS_MCP_API_KEY` set: fetch growth for each keyword; cache results.
3. Pass raw API results + keywords into LLM with `trend_research.md` prompt.
4. If no API key or all calls fail: pass empty signals; LLM uses `llm_estimated`.

**Gate:** With API key, report section 3 mentions at least one source name (Google, TikTok, Amazon, Reddit).

---

## Phase 4 — Frontend (dark mode)

### Theme setup

`app/layout.tsx`:
- Wrap with `ThemeProvider` attribute="class" defaultTheme="dark" enableSystem={false}
- Font: `Geist` or `Inter`
- Body class: `min-h-screen bg-zinc-950 text-zinc-50 antialiased`

`globals.css`: use shadcn zinc dark CSS variables; accent amber:

```css
.dark {
  --primary: 38 92% 50%;  /* amber-500 */
}
```

### Pages

#### `/` — Landing
- Headline: "Ideate your F&B brand with AI"
- Sub: trend-backed product ideas, positioning, and a full report in minutes
- CTA button → `POST /sessions` then redirect to `/ideate?id={uuid}`
- Footer disclaimer

#### `/ideate?id={uuid}` — Wizard
- 7 steps with `WizardShell` (progress indicator 1/7 … 7/7)
- Autosave on "Next" via `PATCH /sessions/{id}`
- Step 7 review shows all answers; "Generate Report" → `POST /run` → redirect `/ideate/{id}/processing`

#### `/ideate/[id]/processing` — Agent timeline
- Connect to `EventSource(`${API}/sessions/${id}/stream`)`
- Show nodes: Clarifier → Trend Research + Market Fit (parallel) → Product Ideation → Critique → Report Writer
- On `done` event → redirect `/report/{id}`
- Show elapsed timer; allow cancel refresh

#### `/report/[id]` — Report viewer
- Fetch `GET /report`
- Tabs mapped to 8 sections + Appendix
- Actions: Copy markdown, Download PDF (`/export/pdf`)
- Sticky disclaimer banner

### lib/api.ts

```typescript
const API = process.env.NEXT_PUBLIC_API_URL!;

export async function createSession() { ... }
export async function patchSession(id: string, step: number, data: unknown) { ... }
export async function runPipeline(id: string) { ... }
export async function getReport(id: string) { ... }
export function streamProgress(id: string, onEvent: (e: AgentProgressEvent) => void) { ... }
```

### lib/validators.ts — Zod schemas mirroring backend wizard models

Keep field names identical to Python models for PATCH compatibility.

### shadcn components to use

Button, Card, Input, Label, Textarea, Select, Tabs, Progress, Badge, Accordion, Separator, Sonner toasts.

**Gate:** Manual flow landing → wizard → processing → report works end-to-end locally.

---

## Phase 5 — PDF export & polish

### services/pdf.py

```python
import markdown
from weasyprint import HTML

def markdown_to_pdf(md: str) -> bytes:
    html_body = markdown.markdown(md, extensions=["tables", "fenced_code"])
    html = f"<html><head><style>body{{font-family:sans-serif;padding:40px;}}</style></head><body>{html_body}</body></html>"
    return HTML(string=html).write_pdf()
```

### Report post-processor

Before saving report, validate markdown contains all required H2 headers. If missing, append placeholder sections rather than failing.

### Rate limiting

Simple in-memory dict: IP → list of run timestamps; reject if > `RATE_LIMIT_RUN_PER_HOUR` in last hour with 429.

### README.md sections to write

1. Prerequisites (Docker, Ollama, 16GB RAM recommended)
2. Quick start (`docker compose up`, pull model)
3. Optional Trends MCP key setup
4. Architecture diagram (ASCII)
5. Troubleshooting (Ollama not reachable, slow inference, JSON parse errors)

**Gate:** PDF downloads; README allows fresh clone → running app.

---

## Wizard field reference (copy into UI labels)

| Step | Fields |
|------|--------|
| 1 Brand basics | brand_name, one_line_concept, category (text + suggestions: specialty coffee, bubble tea, ghost kitchen, meal prep, RTD beverage, bakery, fast casual) |
| 2 Audience | age_bands (multi-select), location_type, dietary_preferences (multi-select) |
| 3 Geography | city_region, business_format (select), format_notes |
| 4 Pricing | price_tier (budget/mid/premium) |
| 5 Idea details | hero_products (tag input, 1-5), inspiration_brands, constraints, custom_trend_keywords (max 3) |
| 6 Goals | launch_timeline, primary_goal |
| 7 Review | read-only summary + edit links |

---

## Test scenarios (run after Phase 5)

Use these wizard inputs to validate report quality:

### Scenario A — Specialty coffee shop (Bangalore, premium)

- Concept: "Third-wave coffee with Indian single-origin focus"
- Hero: pour-over bar, cold brew, coffee subscription
- Expect: at least 5 product ideas tied to specialty coffee trends

### Scenario B — D2C protein snacks (US suburban, mid)

- Concept: "High-protein savory snacks for gym-goers"
- Hero: lentil chips, protein biltong alternatives
- Expect: trend section mentions protein/snacking keywords

### Scenario C — RTD kombucha (exploring, budget)

- Concept: "Affordable gut-health kombucha in retail"
- Constraints: limited capital
- Expect: risks section addresses capital; tweaks suggest phased launch

**Pass criteria per scenario:**
- All 8 report sections present
- ≥5 product suggestions
- ≥3 tweaks in section 8
- No empty trend section (even if llm_estimated)

---

## Deployment (when user asks to deploy)

### VPS (8GB RAM minimum)

1. Install Docker + Docker Compose
2. `docker compose up -d`
3. `docker exec -it fb-ideation-ollama-1 ollama pull qwen2.5:7b`
4. Open port 8000 (API) behind Caddy/nginx with HTTPS
5. Set `CORS_ORIGINS` to Vercel frontend URL

### Vercel (frontend)

1. Root directory: `frontend`
2. Env: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
3. Deploy

**Note:** Ollama on CPU VPS is slow (3-8 tok/s). Progress UI is mandatory. For demos, run Ollama on developer Mac and expose API via tunnel if needed.

---

## Troubleshooting guide (for agent)

| Symptom | Fix |
|---------|-----|
| Ollama connection refused | Check `LLM_BASE_URL`; wait for ollama health; run `ollama list` |
| JSON parse errors from LLM | Lower temperature; retry prompt; try `llama3.1:8b` |
| Empty report sections | Run post-processor; check report_writer prompt |
| Trends API 401 | Key missing — set key or accept llm_estimated mode |
| CORS errors | Add frontend origin to `CORS_ORIGINS` |
| SSE not streaming | Disable buffering in nginx (`X-Accel-Buffering: no`) |
| WeasyPrint fails in Docker | Install `libpango`, `libcairo` in backend Dockerfile |

### Backend Dockerfile system deps for WeasyPrint

```dockerfile
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 libpangoft2-1.0-0 libgdk-pixbuf-2.0-0 libffi-dev shared-mime-info \
    && rm -rf /var/lib/apt/lists/*
```

---

## pyproject.toml dependencies (reference)

```toml
[project]
name = "fb-ideation-api"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "sqlalchemy[asyncio]>=2.0.36",
    "aiosqlite>=0.20.0",
    "pydantic-settings>=2.6.0",
    "httpx>=0.28.0",
    "openai>=1.55.0",
    "langgraph>=0.2.0",
    "langchain-core>=0.3.0",
    "markdown>=3.7",
    "weasyprint>=63.0",
    "python-multipart>=0.0.12",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "pytest-asyncio>=0.24", "httpx"]
```

---

## Suggested agent session prompts

When starting a new Cursor session, paste:

```
Read ~/Projects/fb-ideation/IMPLEMENTATION.md and implement the full MVP.
Follow phases 0-5 in order. Use all decision defaults. Do not ask me questions
unless blocked by a missing secret. Run verification gates after each phase.
Project root: ~/Projects/fb-ideation
```

For partial sessions:

```
Read IMPLEMENTATION.md and continue from Phase {N}. Run the Phase {N} verification gate.
```

---

## Out of scope (do not implement)

- User authentication / Clerk / NextAuth
- Stripe / billing
- Postgres / Redis
- Free-form chat interface (wizard only in v1)
- Mobile native apps
- Model fine-tuning
- Multi-language UI (English only v1)

---

## Success checklist (final)

- [ ] `docker compose up` starts api + web + ollama
- [ ] Landing → wizard → processing → report flow works
- [ ] LangGraph runs 6 agents; SSE shows progress
- [ ] Report has 8 sections + appendix
- [ ] PDF export works
- [ ] Dark mode default; responsive on mobile
- [ ] Disclaimer visible on report page
- [ ] 3 test scenarios produce usable output
- [ ] README documents setup without user hand-holding

---

*Last updated: 2026-08-09 — MVP spec v1*
