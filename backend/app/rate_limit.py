"""A tiny in-memory rate limiter, so one browser cannot flood the AI model (and the bill).

Good enough for a hackathon demo running as a single process. For multiple instances,
replace it with a shared store such as Redis.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from app.config import get_settings

_hits: dict[str, deque[float]] = defaultdict(deque)


def rate_limit(request: Request) -> None:
    limit = get_settings().rate_limit_per_minute
    key = request.client.host if request.client else "unknown"
    now = time.monotonic()
    window = _hits[key]
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= limit:
        raise HTTPException(status_code=429, detail="Astro needs a little break. Please wait a minute and try again.")
    window.append(now)


def reset() -> None:
    _hits.clear()
