"""A daily cap on AI model calls (spec ai-cosmic-tutor.md §8), so a busy or abused demo can't run up a bill.

When the cap is reached, Astro keeps answering in knowledge mode until midnight UTC. The count lives in
memory, per server process: a restart resets it, and with several workers each has its own count.
"""

from __future__ import annotations

import threading
from collections.abc import Callable
from datetime import UTC, date, datetime


def _utc_today() -> date:
    return datetime.now(UTC).date()


class DailyBudget:
    def __init__(self, today: Callable[[], date] = _utc_today):
        self._today = today
        self._day = today()
        self._used = 0
        self._lock = threading.Lock()

    def take(self, cap: int) -> bool:
        """Use one call from today's budget. False when the cap is reached. A cap of 0 or less means no cap."""
        if cap <= 0:
            return True
        with self._lock:
            today = self._today()
            if today != self._day:
                self._day, self._used = today, 0
            if self._used >= cap:
                return False
            self._used += 1
            return True

    @property
    def used(self) -> int:
        return self._used

    def reset(self) -> None:
        with self._lock:
            self._day, self._used = self._today(), 0


#: Shared by every request in this process.
llm_budget = DailyBudget()
