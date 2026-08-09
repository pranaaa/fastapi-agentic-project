from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel


class SessionStatus(str, Enum):
    draft = "draft"
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class SessionCreateResponse(BaseModel):
    id: str


class SessionPatchRequest(BaseModel):
    step: int
    data: dict


class AgentProgressEvent(BaseModel):
    node: str
    status: Literal["started", "completed", "failed"]
    message: str
    timestamp: datetime


class SessionStateResponse(BaseModel):
    id: str
    status: SessionStatus
    wizard: dict
    progress_events: list[dict]
    error_message: str | None = None


class ReportResponse(BaseModel):
    session_id: str
    status: SessionStatus
    markdown: str | None
    sections: dict[str, str] | None
    disclaimer: str = (
        "AI-assisted research, not financial or legal advice. "
        "Validate trends and regulations locally before investing."
    )
