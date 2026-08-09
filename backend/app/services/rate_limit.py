from __future__ import annotations

import time
from collections import defaultdict, deque

from app.config import settings

_HITS: dict[str, deque[float]] = defaultdict(deque)


def check_and_record(ip: str) -> bool:
    """Return True if the request is allowed, False if rate-limited."""
    limit = settings.rate_limit_run_per_hour
    window = 3600.0
    now = time.time()
    hits = _HITS[ip]
    while hits and now - hits[0] > window:
        hits.popleft()
    if len(hits) >= limit:
        return False
    hits.append(now)
    return True
