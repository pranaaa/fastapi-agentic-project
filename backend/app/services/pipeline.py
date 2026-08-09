from __future__ import annotations

import asyncio
import logging

from app.agents.nodes._helpers import event
from app.db.base import SessionLocal
from app.db.repository import SessionRepository

logger = logging.getLogger(__name__)


# Simple in-process pub/sub so the SSE endpoint can stream events as they happen.
_subscribers: dict[str, list[asyncio.Queue]] = {}


def subscribe(session_id: str) -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue()
    _subscribers.setdefault(session_id, []).append(q)
    return q


def unsubscribe(session_id: str, q: asyncio.Queue) -> None:
    if session_id in _subscribers and q in _subscribers[session_id]:
        _subscribers[session_id].remove(q)
        if not _subscribers[session_id]:
            del _subscribers[session_id]


async def _emit(session_id: str, evt: dict) -> None:
    for q in list(_subscribers.get(session_id, [])):
        await q.put(evt)


async def _persist_events(session_id: str, events: list[dict]) -> None:
    async with SessionLocal() as db:
        repo = SessionRepository(db)
        for e in events:
            await repo.append_event(session_id, e)


async def run_pipeline(session_id: str, graph, wizard: dict) -> None:
    """Run the LangGraph pipeline for a session, streaming events as nodes complete."""
    started_evt = event("pipeline", "started", "Pipeline started")
    await _persist_events(session_id, [started_evt])
    await _emit(session_id, started_evt)

    async with SessionLocal() as db:
        repo = SessionRepository(db)
        await repo.set_status(session_id, "running")

    try:
        seen_keys: set[str] = set()
        final_state: dict = {}

        async for chunk in graph.astream(
            {"session_id": session_id, "wizard": wizard, "events": []},
            stream_mode="values",
        ):
            final_state = chunk
            new_events = chunk.get("events", []) or []
            for evt in new_events:
                key = f"{evt.get('node')}|{evt.get('status')}|{evt.get('timestamp')}"
                if key in seen_keys:
                    continue
                seen_keys.add(key)
                await _persist_events(session_id, [evt])
                await _emit(session_id, evt)

        async with SessionLocal() as db:
            repo = SessionRepository(db)
            await repo.save_outputs(session_id, final_state)
            await repo.set_status(session_id, "completed")

        done_evt = event("pipeline", "completed", "Pipeline completed")
        await _persist_events(session_id, [done_evt])
        await _emit(session_id, {**done_evt, "_terminal": True})

    except Exception as e:
        logger.exception("pipeline failure for session %s", session_id)
        async with SessionLocal() as db:
            repo = SessionRepository(db)
            await repo.set_status(session_id, "failed", error_message=str(e))
        fail_evt = event("pipeline", "failed", f"{type(e).__name__}: {e}")
        await _persist_events(session_id, [fail_evt])
        await _emit(session_id, {**fail_evt, "_terminal": True})
