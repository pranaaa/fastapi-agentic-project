# Deploying Menu Muse (100% free)

The two-piece deploy: **frontend on Vercel** + **backend on Render**. Total time first-run: ~10 minutes. After that, iteration is instant — see [How iteration works](#how-iteration-works).

## What you'll need (all free)

| Account | What for | Link |
|---|---|---|
| GitHub | Source of truth for both services | github.com |
| Groq | LLM API key (`gsk_...`) | console.groq.com |
| Tavily *(optional)* | Real web-search trend data (`tvly-...`) | tavily.com |
| Vercel | Frontend hosting | vercel.com |
| Render | Backend hosting (Docker, free plan) | render.com |

---

## Step 1 — Push to GitHub

```bash
cd /Users/pranathiprabhala/Desktop/fastapi-agentic-project
git status                              # confirm your working tree is clean
git add .
git commit -m "Ready to deploy Menu Muse"

# Create a new GitHub repo and push (if you don't have gh installed, do this in the browser)
gh repo create menu-muse --public --source=. --push
# OR:  create the repo at https://github.com/new, then:
#      git remote add origin https://github.com/<you>/menu-muse.git
#      git branch -M main && git push -u origin main
```

That's it — Vercel and Render both read straight from GitHub.

---

## Step 2 — Deploy the backend (Render, ~5 min)

1. Log into [render.com](https://render.com), click **New +** → **Blueprint**.
2. Connect your GitHub repo. Render auto-detects [`render.yaml`](render.yaml) at the root.
3. When it prompts for env vars, paste:
   - **`LLM_API_KEY`** — your Groq key (`gsk_...`)
   - **`CORS_ORIGINS`** — for now set this to `*` (we'll tighten it after Vercel is up)
   - **`TAVILY_API_KEY`** — your Tavily key (or leave blank for LLM-only trends)
   - **`TRENDS_MCP_API_KEY`** — leave blank
4. Click **Apply**. First build takes ~5 min (installs WeasyPrint deps in Docker).
5. When it's live, note the URL — it'll look like `https://fb-ideation-api.onrender.com`.
6. Test: open `https://<your-url>/api/v1/health` — should return `{"status":"ok","llm":"ok"}`.

**Render free-tier caveats:**
- Instance sleeps after ~15 min of no traffic. First request after sleep takes ~30 s to wake.
- Filesystem is ephemeral — SQLite data resets on redeploy. Fine for the MVP.
- 512 MB RAM. WeasyPrint fits.

---

## Step 3 — Deploy the frontend (Vercel, ~2 min)

1. Go to [vercel.com/new](https://vercel.com/new). Import your GitHub repo.
2. **Root directory:** `frontend`  (this is important — the repo has both `frontend/` and `backend/`).
3. Framework preset: **Next.js** (auto-detected).
4. **Environment variables** (click "Environment Variables" before deploying):
   - `NEXT_PUBLIC_API_URL` = your Render URL (e.g. `https://fb-ideation-api.onrender.com`)
5. Click **Deploy**. Takes ~90 s.

Copy the Vercel URL (like `https://menu-muse.vercel.app`).

---

## Step 4 — Lock CORS to your Vercel URL

Back on Render:
1. Your service → **Environment**
2. Edit `CORS_ORIGINS` → set to your Vercel URL: `https://menu-muse.vercel.app`
   (multiple? comma-separate: `https://menu-muse.vercel.app,https://menu-muse-git-main-...vercel.app`)
3. Save → Render auto-redeploys in ~2 min.

Done. Your site is live and free.

---

## How iteration works

**Short version:** you edit code, `git push`, and both services redeploy themselves. No manual button-pushing needed.

### The workflow

```bash
# 1. Edit code locally (as you have been)
# 2. Commit + push to main
git add -A && git commit -m "Add xyz" && git push
```

- **Vercel** picks up the push in ~5 seconds and starts a build. Frontend redeploys in ~60-90 s.
- **Render** picks up the push in ~30 seconds and starts a Docker build. Backend redeploys in ~4-5 min (Docker rebuild).
- Both give you a URL you can watch the build on.

### Preview deploys — the killer feature

Every push to a **non-main branch** gets its own throwaway URL:

```bash
git checkout -b try-new-agent
# edit, commit
git push -u origin try-new-agent
```

Vercel spins up `https://menu-muse-git-try-new-agent-<you>.vercel.app` for that branch. Share the link with anyone — non-technical stakeholders can click and try the change *before* it merges to `main`.

When you're happy, merge the branch to `main` and it goes live.

### Rollbacks are one click

Both Vercel and Render keep a list of past deploys. Any release goes back to being live in ~15 seconds by clicking "Promote to production" on an older deploy.

### Editing env vars

Change a value on Render (e.g. `LLM_MODEL`) → click **Manual Deploy** → **Deploy latest commit**. Takes ~4 min.

Same for Vercel env vars — settings → environment variables → save → **Redeploy**.

---

## Recommended: use branches for experiments

For anything you're not sure about (new agent, bigger prompt, UI redesign), work on a branch. Preview deploys let you demo the change to your co-founder / customer before promoting it. Once merged to `main`, it's live for real users.

```bash
git checkout main && git pull
git checkout -b split-report-writer
# ...edit, test locally, commit...
git push -u origin split-report-writer     # → preview URL
# review, then:
gh pr create --base main --head split-report-writer --fill
gh pr merge --squash                        # → main redeploys automatically
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `CORS error` in browser console | `CORS_ORIGINS` on Render doesn't include your Vercel URL — update and redeploy |
| Health endpoint says `"llm":"unreachable"` | `LLM_API_KEY` missing or wrong on Render |
| First request always slow | Render free-tier cold start — expected, first hit after 15 min idle takes ~30 s |
| Frontend deployed but blank | Check Vercel build log → usually a missing env var (`NEXT_PUBLIC_API_URL`) |
| Backend build fails on Render | Usually a missing system dep for WeasyPrint — already covered in [`backend/Dockerfile`](backend/Dockerfile) |
| PDF export 500s in prod but works locally | Confirm the Dockerfile is being used (Render → Settings → Environment shows "Docker") |

---

## Costs

Zero. All services above have free tiers this project fits inside:

- **Vercel Hobby**: free forever for personal projects, 100 GB bandwidth/month
- **Render free**: 750 hours/month across all your services, spins down after 15 min idle
- **Groq free**: `openai/gpt-oss-120b` — 200K tokens/day. `llama-3.1-8b-instant` — 500K tokens/day. Together good for ~3-5 reports/day.
- **Tavily free**: 1,000 web searches/month (each report uses ~3-5)

If you outgrow this, the paid steps are cheap: Groq Dev tier is ~$0.60/1M tokens, Render Starter is $7/month, Tavily Pro is $30/month.
