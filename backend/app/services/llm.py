"""LLM client — uses the OpenAI Python SDK against any OpenAI-compatible endpoint
(Groq free tier by default, or Ollama locally via env overrides).

Handles two Groq-specific failure modes:
  1. 429 rate-limit responses on free tier — parses the "try again in Xs" hint
     from the error body and waits that long (with jitter) before retrying.
  2. 400 `json_validate_failed` — Groq validates JSON server-side; when the
     model appends trailing garbage we extract `failed_generation` from the
     error body and attempt a balanced-brace repair before giving up.
"""
from __future__ import annotations

import asyncio
import json
import logging
import random
import re
from typing import Any

from openai import AsyncOpenAI, BadRequestError, RateLimitError

from app.config import settings

logger = logging.getLogger(__name__)


def _make_client() -> AsyncOpenAI:
    api_key = settings.llm_api_key or "ollama"
    return AsyncOpenAI(
        base_url=settings.llm_base_url,
        api_key=api_key,
        timeout=settings.llm_timeout_seconds,
        max_retries=0,  # we own the retry logic
    )


client = _make_client()

RATE_LIMIT_MAX_RETRIES = 6
RATE_LIMIT_MAX_WAIT_SECONDS = 65.0
_RETRY_HINT_RE = re.compile(r"try again in ([\d.]+)\s*s", re.IGNORECASE)


def _parse_retry_hint(err: RateLimitError, attempt: int) -> float:
    msg = str(err)
    m = _RETRY_HINT_RE.search(msg)
    if m:
        try:
            hint = float(m.group(1))
            # add a small jittered buffer to avoid herding at the exact boundary
            return min(hint + 0.5 + random.uniform(0, 1.0), RATE_LIMIT_MAX_WAIT_SECONDS)
        except ValueError:
            pass
    return min(2 ** attempt, RATE_LIMIT_MAX_WAIT_SECONDS)


def _extract_failed_generation(err: BadRequestError) -> str | None:
    """Groq puts the raw model output in error.body.error.failed_generation.
    Fall back to regex-scraping the string repr if the SDK doesn't parse it."""
    body: Any = getattr(err, "body", None)
    if isinstance(body, dict):
        inner = body.get("error") if isinstance(body.get("error"), dict) else body
        gen = inner.get("failed_generation") if isinstance(inner, dict) else None
        if isinstance(gen, str) and gen:
            return gen
    m = re.search(r"'failed_generation':\s*'((?:[^'\\]|\\.)*)'", str(err))
    if m:
        return m.group(1).encode("utf-8").decode("unicode_escape")
    return None


def _extract_valid_json(text: str) -> dict | None:
    """Try increasingly aggressive strategies to parse a JSON object out of `text`.

    Handles: markdown fences, leading/trailing prose, trailing garbage after a
    valid closing brace (a common failure mode for gpt-oss models)."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Balanced-brace scan from the first '{' — return the LARGEST valid slice.
    start = text.find("{")
    if start < 0:
        return None
    depth = 0
    in_string = False
    escape = False
    best: dict | None = None
    for i in range(start, len(text)):
        ch = text[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                candidate = text[start : i + 1]
                try:
                    best = json.loads(candidate)
                except json.JSONDecodeError:
                    pass
    return best


async def _create_with_retry(**kwargs):
    for attempt in range(RATE_LIMIT_MAX_RETRIES + 1):
        try:
            return await client.chat.completions.create(**kwargs)
        except RateLimitError as e:
            if attempt >= RATE_LIMIT_MAX_RETRIES:
                raise
            wait_s = _parse_retry_hint(e, attempt)
            logger.info("llm rate-limited, sleeping %.1fs (attempt %d)", wait_s, attempt + 1)
            await asyncio.sleep(wait_s)


async def chat_json(
    system: str,
    user: str,
    retries: int = 2,
    max_tokens: int | None = None,
    model: str | None = None,
) -> dict:
    """Call the LLM and return a parsed JSON object.

    Retries on parse failures with a stricter instruction. Handles Groq's
    server-side JSON validation (400 json_validate_failed) by attempting to
    repair the returned `failed_generation` before giving up.

    Pass `model=settings.llm_model_light` for lightweight agents to route them
    to the faster/cheaper model and preserve heavy-model daily budget.
    """
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]

    active_model = model or settings.llm_model
    last_snippet = ""
    for attempt in range(retries + 1):
        content = ""
        try:
            resp = await _create_with_retry(
                model=active_model,
                messages=messages,
                temperature=settings.llm_temperature,
                max_tokens=max_tokens or settings.llm_max_tokens,
                response_format={"type": "json_object"},
            )
            content = (resp.choices[0].message.content or "").strip()
        except BadRequestError as e:
            # Groq's server-side JSON validator rejected the output.
            content = _extract_failed_generation(e) or ""
            last_snippet = str(e)[:200]
            logger.info("groq json_validate_failed, attempting repair (attempt %d)", attempt + 1)

        if content:
            last_snippet = content[:200]
            parsed = _extract_valid_json(content)
            if parsed is not None:
                return parsed

        messages.append(
            {
                "role": "user",
                "content": (
                    "Your previous output was not valid JSON. Return ONLY a single valid "
                    "JSON object matching the requested schema — no markdown fences, no "
                    "prose before or after, and DO NOT append any characters after the "
                    "final closing brace."
                ),
            }
        )

    raise ValueError(f"LLM returned unparseable JSON after {retries + 1} attempts: {last_snippet}")


async def ping_llm() -> bool:
    """Cheap health probe — issues a 1-token completion."""
    try:
        await client.chat.completions.create(
            model=settings.llm_model,
            messages=[{"role": "user", "content": "ping"}],
            max_tokens=1,
        )
        return True
    except Exception:
        return False
