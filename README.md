# F&B Ideation Platform

Trend-backed brand & product ideation for F&B founders. Fill out a 7-step wizard, and a LangGraph pipeline of specialized AI agents generates a 9-section report with product suggestions, positioning, risks, and concrete tweaks. PDF export included.

**Fully free stack:** Groq (open-source LLMs, generous free tier) + FastAPI on Render + Next.js on Vercel.

## Architecture

```
┌─────────────────┐     REST + SSE     ┌──────────────────┐         ┌────────────┐
│  Next.js (web)  │ ◄────────────────► │  FastAPI (api)   │ ──────► │    Groq    │
│  dark shadcn UI │                    │  LangGraph agents│         │  Llama 3.3 │
└─────────────────┘                    └────────┬─────────┘         └────────────┘
                                                │
                                                ▼
                                          ┌──────────┐
                                          │  SQLite  │
                                          └──────────┘
```

**Agent flow:** `clarifier → [trend_research ∥ market_fit] → product_ideation → critique → report_writer`.

## Prerequisites

- Python 3.11+ (project tested on 3.12)
- Node 20+ and pnpm
- A free [Groq](https://console.groq.com) account (for the LLM)

## Local development

### 1. Backend

```bash
cd backend
python3.12 -m venv ../.venv
../.venv/bin/pip install -r requirements.txt

# Create backend/.env from the example at repo root
cp ../.env.example .env
# Then edit .env and set LLM_API_KEY=gsk_... (from console.groq.com)

../.venv/bin/uvicorn app.main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/api/v1/health` should return `{"status":"ok","llm":"ok"}` once the key is set.

### 2. Frontend

```bash
cd frontend
pnpm install
cp .env.local.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:8000
pnpm dev
```

Open http://localhost:3000. The full happy path: landing → wizard (7 steps) → processing (SSE live updates) → report → PDF download.

### 3. Tests

```bash
cd backend && ../.venv/bin/pytest -v
cd frontend && pnpm exec tsc --noEmit
```

## Deployment (100% free tier)

### Step 1 — Push to GitHub

```bash
git init                       # already initialized in this repo
git add .
git commit -m "Initial F&B ideation MVP"
gh repo create fb-ideation --public --source=. --push   # or push manually
```

### Step 2 — Backend on Render (Docker, free plan)

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Blueprint** → connect your GitHub repo.
2. Render detects [`render.yaml`](render.yaml) at the root and previews the service.
3. When prompted, supply values for:
   - `LLM_API_KEY` — your Groq key (`gsk_...` from [console.groq.com](https://console.groq.com))
   - `CORS_ORIGINS` — the Vercel URL you'll create next, e.g. `https://fb-ideation.vercel.app`. You can set this to `*` temporarily and lock it down after the frontend is up.
   - `TRENDS_MCP_API_KEY` — leave blank unless you have one
4. Deploy. First build takes ~4-6 minutes (installs WeasyPrint deps). Your API lives at `https://fb-ideation-api.onrender.com`.
5. Health check: `https://<your-url>/api/v1/health` should show `{"status":"ok","llm":"ok"}`.

**Free-tier caveats:**
- Instance sleeps after ~15 min idle; first request after sleep takes ~30 s to wake up.
- Filesystem is ephemeral, so SQLite data resets on redeploy (fine for the MVP — sessions are short-lived).
- 512 MB RAM. WeasyPrint's PDF export works but keep reports under ~30 pages.

### Step 3 — Frontend on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → **Add New Project** → import the same GitHub repo.
2. **Root directory:** `frontend`
3. Framework preset: **Next.js** (auto-detected)
4. Environment variables:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL (e.g. `https://fb-ideation-api.onrender.com`)
5. Deploy. Takes ~90 seconds.
6. Copy the Vercel URL and go back to Render → **Environment** → update `CORS_ORIGINS` to that URL, then **Manual Deploy**.

Done. Your website is live and free.

### Optional: custom domain
Both Render (backend) and Vercel (frontend) support free custom domains. Update `CORS_ORIGINS` and `NEXT_PUBLIC_API_URL` after.

## Configuration reference

See [`.env.example`](.env.example) for all backend env vars.

| Var | Default | Notes |
|---|---|---|
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | Any OpenAI-compatible endpoint |
| `LLM_MODEL` | `llama-3.3-70b-versatile` | Try `llama-3.1-8b-instant` for lower latency |
| `LLM_API_KEY` | *(required)* | Groq key. For Ollama set to any non-empty string. |
| `TRENDS_MCP_API_KEY` | *(empty)* | Optional; pipeline degrades to LLM-estimated trends |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated frontend origins |
| `RATE_LIMIT_RUN_PER_HOUR` | `10` | Per-IP rate limit for `/run` |
| `DATABASE_URL` | `sqlite+aiosqlite:///./data/app.db` | |

### Running against local Ollama instead of Groq

```bash
# In backend/.env
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=qwen2.5:7b
LLM_API_KEY=ollama
```

Then `ollama pull qwen2.5:7b && ollama serve`.

## Project layout

```
backend/
  app/
    main.py                 # FastAPI app + lifespan
    config.py               # pydantic-settings
    api/routes/             # health, sessions
    agents/
      graph.py              # LangGraph builder
      state.py
      nodes/                # 6 agent nodes
      prompts/              # markdown prompt templates
    models/                 # pydantic models: brand, agents, session
    services/               # llm (OpenAI SDK), trends, pipeline, pdf, rate_limit
    db/                     # SQLAlchemy async engine + repository
  tests/                    # pytest suite
  Dockerfile
frontend/
  app/                      # Next.js 16 App Router (dark mode default)
    page.tsx                # landing
    ideate/page.tsx         # wizard
    ideate/[id]/processing/ # SSE live agent timeline
    report/[id]/            # report viewer with PDF export
  components/
    wizard/                 # 7 step components + shell
    processing/             # agent-timeline (SSE consumer)
    report/                 # markdown-viewer, report-view
    ui/                     # button/card/input/label/select/... primitives
  lib/                      # api client, types, zod validators, utils
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Health endpoint says `"llm":"unreachable"` | Missing/invalid `LLM_API_KEY`. Sign up at console.groq.com. |
| `429 Rate limit exceeded` from Groq | You're above the free-tier RPM. Wait a minute or switch to `llama-3.1-8b-instant`. |
| CORS errors in browser | Add your frontend origin to `CORS_ORIGINS` on Render, then redeploy. |
| PDF export 500s | WeasyPrint needs `libpango`/`libcairo` (already in `backend/Dockerfile`). |
| Render free tier cold start | First request after 15 min idle takes ~30 s. Vercel keeps the frontend warm. |
| SSE stream disconnects behind a proxy | We already set `X-Accel-Buffering: no`. Some proxies still buffer; keep-alive pings arrive every 15 s. |

## Legal

This tool produces AI-assisted research and is not financial or legal advice. Validate trends and regulations locally before investing.
