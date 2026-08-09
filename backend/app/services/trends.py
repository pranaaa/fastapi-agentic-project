from __future__ import annotations

import asyncio
from datetime import datetime, timedelta

import httpx

from app.config import settings
from app.db.base import SessionLocal
from app.db.repository import TrendCacheRepository

CACHE_TTL = timedelta(hours=24)
DEFAULT_SOURCES = "google search, tiktok, amazon"


async def _fetch_one(client: httpx.AsyncClient, keyword: str) -> dict | None:
    if not settings.trends_mcp_api_key:
        return None

    async with SessionLocal() as db:
        cache_repo = TrendCacheRepository(db)
        cached = await cache_repo.get(keyword, DEFAULT_SOURCES)
        if cached and datetime.utcnow() - cached.fetched_at < CACHE_TTL:
            return cached.response_json

    body = {
        "mode": "get_growth",
        "source": DEFAULT_SOURCES,
        "keyword": keyword,
        "percent_growth": ["3M", "12M"],
    }
    headers = {"Authorization": f"Bearer {settings.trends_mcp_api_key}"}
    try:
        r = await client.post(settings.trends_mcp_base_url, json=body, headers=headers, timeout=30)
        r.raise_for_status()
        payload = r.json()
    except Exception:
        return None

    async with SessionLocal() as db:
        cache_repo = TrendCacheRepository(db)
        await cache_repo.upsert(keyword, DEFAULT_SOURCES, payload)
    return payload


async def fetch_signals_for_keywords(keywords: list[str]) -> tuple[list[dict], str]:
    """Return (signals, data_quality_hint) for the LLM prompt."""
    if not settings.trends_mcp_api_key or not keywords:
        return [], "llm_estimated"

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[_fetch_one(client, kw) for kw in keywords])

    signals: list[dict] = []
    hits = 0
    for kw, payload in zip(keywords, results):
        if payload:
            hits += 1
            signals.append({"keyword": kw, "raw": payload})

    if hits == 0:
        return [], "llm_estimated"
    if hits < len(keywords):
        return signals, "partial"
    return signals, "live_api"
