"""LLM client — uses the OpenAI Python SDK against any OpenAI-compatible endpoint
(Groq free tier by default, or Ollama locally via env overrides)."""
from __future__ import annotations

import json
from openai import AsyncOpenAI

from app.config import settings


def _make_client() -> AsyncOpenAI:
    # Groq requires a real key. Ollama ignores the key but the SDK still needs a non-empty value.
    api_key = settings.llm_api_key or "ollama"
    return AsyncOpenAI(
        base_url=settings.llm_base_url,
        api_key=api_key,
        timeout=settings.llm_timeout_seconds,
    )


client = _make_client()


async def chat_json(system: str, user: str, retries: int = 1) -> dict:
    """Call the LLM and parse the response as JSON.

    Retries once with a stricter instruction on parse failure.
    """
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]

    last_content = ""
    for attempt in range(retries + 1):
        resp = await client.chat.completions.create(
            model=settings.llm_model,
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        content = (resp.choices[0].message.content or "").strip()
        last_content = content
        if content:
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                pass
        messages.append(
            {
                "role": "user",
                "content": "Your previous response was not valid JSON. Return valid JSON only, matching the requested schema.",
            }
        )

    raise ValueError(f"LLM returned non-JSON after {retries + 1} attempts: {last_content[:200]}")


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
