from __future__ import annotations

from fastapi import APIRouter

from app.services.llm import ping_llm

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    llm_ok = await ping_llm()
    return {"status": "ok", "llm": "ok" if llm_ok else "unreachable"}
