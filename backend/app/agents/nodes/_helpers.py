from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def load_prompt(name: str) -> str:
    return (PROMPTS_DIR / name).read_text(encoding="utf-8")


def event(node: str, status: str, message: str) -> dict:
    return {
        "node": node,
        "status": status,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def compact_json(obj: Any) -> str:
    """Serialize JSON with no whitespace — every token counts under free-tier TPM."""
    return json.dumps(obj, separators=(",", ":"), default=str, ensure_ascii=False)
