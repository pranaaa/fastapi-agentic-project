"""Tavily Search integration — grounds trend research in real web data.

Free tier: 1,000 searches/month at https://tavily.com. Sign up → get a key
starting with `tvly-...`. Set TAVILY_API_KEY in .env to activate.

When the key is missing or a call fails, the pipeline gracefully degrades to
LLM-only trend research (`data_quality: "llm_estimated"`).
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta

import httpx

from app.config import settings
from app.db.base import SessionLocal
from app.db.repository import TrendCacheRepository

logger = logging.getLogger(__name__)

TAVILY_URL = "https://api.tavily.com/search"
CACHE_TTL = timedelta(hours=12)
CACHE_KEY_SOURCE = "tavily"


async def _search_one(client: httpx.AsyncClient, keyword: str) -> dict | None:
    if not settings.tavily_api_key:
        return None

    # Cache lookup — Tavily's free tier is capped, and repeat keywords are common.
    async with SessionLocal() as db:
        cache_repo = TrendCacheRepository(db)
        cached = await cache_repo.get(keyword, CACHE_KEY_SOURCE)
        if cached and datetime.utcnow() - cached.fetched_at < CACHE_TTL:
            return cached.response_json

    body = {
        "api_key": settings.tavily_api_key,
        "query": f"{keyword} food trend 2026 consumer",
        "search_depth": "basic",
        "topic": "general",
        "max_results": 5,
        "include_answer": True,
        # bias toward recent trend coverage
        "time_range": "year",
    }

    try:
        r = await client.post(TAVILY_URL, json=body, timeout=25)
        r.raise_for_status()
        payload = r.json()
    except Exception as e:
        logger.info("tavily search failed for %r: %s", keyword, e)
        return None

    async with SessionLocal() as db:
        cache_repo = TrendCacheRepository(db)
        await cache_repo.upsert(keyword, CACHE_KEY_SOURCE, payload)
    return payload


async def search_trends(keywords: list[str]) -> tuple[list[dict], str]:
    """Return (compact_signals, data_quality) for the LLM prompt.

    Each signal shape: {"keyword", "answer", "sources": [{"title", "url", "snippet"}]}
    """
    if not settings.tavily_api_key or not keywords:
        return [], "llm_estimated"

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[_search_one(client, k) for k in keywords[:5]])

    signals: list[dict] = []
    hits = 0
    for kw, payload in zip(keywords, results):
        if not payload:
            continue
        hits += 1
        raw_sources = (payload.get("results") or [])[:4]
        signals.append(
            {
                "keyword": kw,
                "answer": (payload.get("answer") or "").strip()[:600],
                "sources": [
                    {
                        "title": (s.get("title") or "")[:140],
                        "url": s.get("url") or "",
                        "snippet": (s.get("content") or "")[:300],
                    }
                    for s in raw_sources
                ],
            }
        )

    if hits == 0:
        return [], "llm_estimated"
    if hits < len(keywords):
        return signals, "partial"
    return signals, "live_api"
