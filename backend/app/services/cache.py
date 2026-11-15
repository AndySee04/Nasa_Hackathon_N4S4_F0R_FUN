"""Exact-match answer cache (docs/specs/ai-cosmic-tutor.md §8).

Many children ask the same questions ("Why is Mars red?"). A cached answer costs nothing and
returns instantly. Kept in memory: small, private, and gone when the server restarts.
Blocked messages and messages with personal information are never cached (the safety check
runs first and returns before the cache is touched).
"""

from __future__ import annotations

import re
import threading
import time
from collections import OrderedDict
from typing import Generic, TypeVar

T = TypeVar("T")

DEFAULT_TTL_SECONDS = 7 * 24 * 3600
DEFAULT_MAX_ENTRIES = 500


def normalize_question(text: str) -> str:
    """'  Why is MARS red?? ' and 'why is mars red' share one cache entry."""
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s'-]", " ", text.lower())).strip()


class AnswerCache(Generic[T]):
    def __init__(self, ttl_seconds: float = DEFAULT_TTL_SECONDS, max_entries: int = DEFAULT_MAX_ENTRIES, clock=time.monotonic):
        self.ttl = ttl_seconds
        self.max_entries = max_entries
        self._clock = clock
        self._items: OrderedDict[str, tuple[float, T]] = OrderedDict()
        self._lock = threading.Lock()

    @staticmethod
    def key(question: str, *parts: str | None) -> str:
        return "|".join([normalize_question(question), *(p or "" for p in parts)])

    def get(self, key: str) -> T | None:
        with self._lock:
            item = self._items.get(key)
            if item is None:
                return None
            expires, value = item
            if expires < self._clock():
                del self._items[key]
                return None
            self._items.move_to_end(key)
            return value

    def put(self, key: str, value: T) -> None:
        with self._lock:
            self._items[key] = (self._clock() + self.ttl, value)
            self._items.move_to_end(key)
            while len(self._items) > self.max_entries:
                self._items.popitem(last=False)

    def clear(self) -> None:
        with self._lock:
            self._items.clear()

    def __len__(self) -> int:
        return len(self._items)


#: One cache for the whole server process.
answer_cache: AnswerCache = AnswerCache()
