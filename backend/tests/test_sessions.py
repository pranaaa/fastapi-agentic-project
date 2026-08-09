from __future__ import annotations

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


VALID_STEPS = {
    1: {"brand_name": "Test Brand", "one_line_concept": "A very testable concept", "category": "coffee"},
    2: {"age_bands": ["25-34"], "location_type": "urban", "dietary_preferences": []},
    3: {"city_region": "Bangalore", "business_format": "cafe", "format_notes": ""},
    4: {"price_tier": "premium"},
    5: {
        "hero_products": ["pour over"],
        "inspiration_brands": [],
        "constraints": [],
        "custom_trend_keywords": [],
    },
    6: {"launch_timeline": "3-6_months", "primary_goal": "validate_idea"},
}


@pytest.mark.asyncio
async def test_create_and_patch_session():
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            r = await ac.post("/api/v1/sessions")
            assert r.status_code == 200
            sid = r.json()["id"]

            for step, data in VALID_STEPS.items():
                r = await ac.patch(f"/api/v1/sessions/{sid}", json={"step": step, "data": data})
                assert r.status_code == 200, r.text

            r = await ac.get(f"/api/v1/sessions/{sid}")
            assert r.status_code == 200
            body = r.json()
            assert body["wizard"]["basics"]["brand_name"] == "Test Brand"
            assert body["wizard"]["goals"]["primary_goal"] == "validate_idea"


@pytest.mark.asyncio
async def test_invalid_step_data_rejected():
    async with app.router.lifespan_context(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            r = await ac.post("/api/v1/sessions")
            sid = r.json()["id"]

            # too-short one_line_concept
            r = await ac.patch(
                f"/api/v1/sessions/{sid}",
                json={"step": 1, "data": {"brand_name": "x", "one_line_concept": "hi", "category": "coffee"}},
            )
            assert r.status_code == 422
