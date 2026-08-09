from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Session as SessionRow, TrendCache


class SessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, client_ip: str | None = None) -> SessionRow:
        row = SessionRow(client_ip=client_ip, wizard_json={}, progress_events_json=[])
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return row

    async def get(self, session_id: str) -> SessionRow | None:
        result = await self.db.execute(select(SessionRow).where(SessionRow.id == session_id))
        return result.scalar_one_or_none()

    async def patch_wizard(self, session_id: str, step_key: str, data: dict) -> SessionRow | None:
        row = await self.get(session_id)
        if not row:
            return None
        wizard = dict(row.wizard_json or {})
        existing = dict(wizard.get(step_key) or {})
        existing.update(data)
        wizard[step_key] = existing
        row.wizard_json = wizard
        row.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(row)
        return row

    async def set_status(
        self,
        session_id: str,
        status: str,
        error_message: str | None = None,
    ) -> None:
        row = await self.get(session_id)
        if not row:
            return
        row.status = status
        if error_message is not None:
            row.error_message = error_message
        row.updated_at = datetime.utcnow()
        await self.db.commit()

    async def append_event(self, session_id: str, event: dict) -> None:
        row = await self.get(session_id)
        if not row:
            return
        events = list(row.progress_events_json or [])
        events.append(event)
        row.progress_events_json = events
        row.updated_at = datetime.utcnow()
        await self.db.commit()

    async def save_outputs(self, session_id: str, state: dict[str, Any]) -> None:
        row = await self.get(session_id)
        if not row:
            return
        row.brand_brief_json = state.get("brand_brief")
        row.agent_outputs_json = {
            "trend_research": state.get("trend_research"),
            "market_fit": state.get("market_fit"),
            "product_ideation": state.get("product_ideation"),
            "critique": state.get("critique"),
        }
        report = state.get("report") or {}
        row.report_markdown = report.get("markdown")
        row.report_sections_json = report.get("sections")
        row.updated_at = datetime.utcnow()
        await self.db.commit()


class TrendCacheRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, keyword: str, sources: str) -> TrendCache | None:
        result = await self.db.execute(
            select(TrendCache).where(TrendCache.keyword == keyword, TrendCache.sources == sources)
        )
        return result.scalars().first()

    async def upsert(self, keyword: str, sources: str, response_json: dict) -> None:
        existing = await self.get(keyword, sources)
        if existing:
            existing.response_json = response_json
            existing.fetched_at = datetime.utcnow()
        else:
            self.db.add(TrendCache(keyword=keyword, sources=sources, response_json=response_json))
        await self.db.commit()
