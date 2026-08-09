from __future__ import annotations

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import SessionLocal


async def get_db() -> AsyncSession:
    async with SessionLocal() as session:
        yield session


def get_client_ip(request: Request) -> str:
    # honor X-Forwarded-For when behind a proxy (Render/Vercel edge)
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
