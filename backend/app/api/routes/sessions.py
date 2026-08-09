from __future__ import annotations

import asyncio
import json
from typing import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_client_ip, get_db
from app.db.repository import SessionRepository
from app.models.brand import (
    Audience,
    BrandBasics,
    GeographyFormat,
    Goals,
    IdeaDetails,
    Pricing,
)
from app.models.session import (
    ReportResponse,
    SessionCreateResponse,
    SessionPatchRequest,
    SessionStateResponse,
    SessionStatus,
)
from app.services import pipeline as pipeline_service
from app.services.pdf import markdown_to_pdf
from app.services.rate_limit import check_and_record

router = APIRouter(prefix="/sessions", tags=["sessions"])

STEP_KEYS = {
    1: ("basics", BrandBasics),
    2: ("audience", Audience),
    3: ("geography", GeographyFormat),
    4: ("pricing", Pricing),
    5: ("idea_details", IdeaDetails),
    6: ("goals", Goals),
    7: ("review", None),  # review has no payload; no-op patch is allowed
}


@router.post("", response_model=SessionCreateResponse)
async def create_session(request: Request, db: AsyncSession = Depends(get_db)):
    repo = SessionRepository(db)
    row = await repo.create(client_ip=get_client_ip(request))
    return {"id": row.id}


@router.patch("/{session_id}", response_model=SessionStateResponse)
async def patch_session(
    session_id: str,
    body: SessionPatchRequest,
    db: AsyncSession = Depends(get_db),
):
    if body.step not in STEP_KEYS:
        raise HTTPException(400, "step must be 1..7")

    step_key, model = STEP_KEYS[body.step]

    if model is not None:
        try:
            model.model_validate(body.data)
        except Exception as e:
            raise HTTPException(422, f"Invalid step {body.step} payload: {e}")

    repo = SessionRepository(db)
    row = await repo.patch_wizard(session_id, step_key, body.data)
    if not row:
        raise HTTPException(404, "session not found")

    return SessionStateResponse(
        id=row.id,
        status=SessionStatus(row.status),
        wizard=row.wizard_json or {},
        progress_events=row.progress_events_json or [],
        error_message=row.error_message,
    )


@router.get("/{session_id}", response_model=SessionStateResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    repo = SessionRepository(db)
    row = await repo.get(session_id)
    if not row:
        raise HTTPException(404, "session not found")
    return SessionStateResponse(
        id=row.id,
        status=SessionStatus(row.status),
        wizard=row.wizard_json or {},
        progress_events=row.progress_events_json or [],
        error_message=row.error_message,
    )


@router.post("/{session_id}/run")
async def run_session(
    session_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    if not check_and_record(get_client_ip(request)):
        raise HTTPException(429, "Rate limit exceeded — try again in an hour.")

    repo = SessionRepository(db)
    row = await repo.get(session_id)
    if not row:
        raise HTTPException(404, "session not found")

    wizard = row.wizard_json or {}
    required = ["basics", "audience", "geography", "pricing", "idea_details", "goals"]
    missing = [k for k in required if not wizard.get(k)]
    if missing:
        raise HTTPException(400, f"Wizard incomplete — missing: {', '.join(missing)}")

    await repo.set_status(session_id, "queued")

    graph = request.app.state.graph
    asyncio.create_task(pipeline_service.run_pipeline(session_id, graph, wizard))

    return {"status": "queued"}


@router.get("/{session_id}/stream")
async def stream_progress(session_id: str, request: Request):
    # Verify session exists
    from app.db.base import SessionLocal
    async with SessionLocal() as db:
        repo = SessionRepository(db)
        row = await repo.get(session_id)
        if not row:
            raise HTTPException(404, "session not found")
        initial_events = list(row.progress_events_json or [])
        initial_status = row.status

    q = pipeline_service.subscribe(session_id)

    async def event_generator() -> AsyncIterator[str]:
        try:
            # Replay any events already recorded so late subscribers catch up.
            for evt in initial_events:
                yield f"event: progress\ndata: {json.dumps(evt)}\n\n"

            if initial_status in ("completed", "failed"):
                yield f"event: done\ndata: {json.dumps({'status': initial_status})}\n\n"
                return

            while True:
                if await request.is_disconnected():
                    return
                try:
                    evt = await asyncio.wait_for(q.get(), timeout=15.0)
                except asyncio.TimeoutError:
                    # heartbeat to keep the connection alive through proxies
                    yield ": keepalive\n\n"
                    continue

                if evt.pop("_terminal", False):
                    yield f"event: progress\ndata: {json.dumps(evt)}\n\n"
                    status = "failed" if evt.get("status") == "failed" else "completed"
                    yield f"event: done\ndata: {json.dumps({'status': status})}\n\n"
                    return

                yield f"event: progress\ndata: {json.dumps(evt)}\n\n"
        finally:
            pipeline_service.unsubscribe(session_id, q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{session_id}/report", response_model=ReportResponse)
async def get_report(session_id: str, db: AsyncSession = Depends(get_db)):
    repo = SessionRepository(db)
    row = await repo.get(session_id)
    if not row:
        raise HTTPException(404, "session not found")
    return ReportResponse(
        session_id=row.id,
        status=SessionStatus(row.status),
        markdown=row.report_markdown,
        sections=row.report_sections_json,
    )


@router.get("/{session_id}/export/pdf")
async def export_pdf(session_id: str, db: AsyncSession = Depends(get_db)):
    repo = SessionRepository(db)
    row = await repo.get(session_id)
    if not row:
        raise HTTPException(404, "session not found")
    if not row.report_markdown:
        raise HTTPException(400, "Report not ready")
    try:
        pdf_bytes = markdown_to_pdf(row.report_markdown)
    except Exception as e:
        raise HTTPException(500, f"PDF generation failed: {e}")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="fb-ideation-{session_id[:8]}.pdf"'},
    )
