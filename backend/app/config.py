"""Runtime settings, read from environment variables (or a local .env file).

Secrets such as ANTHROPIC_API_KEY must only ever live in the server environment,
never in frontend code or in Git.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

try:  # python-dotenv is optional; it just makes local development easier.
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:  # pragma: no cover
    pass


def _origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    return [o.strip() for o in raw.split(",") if o.strip()]


@dataclass(frozen=True)
class Settings:
    anthropic_api_key: str | None = field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY") or None)
    astro_model: str = field(default_factory=lambda: os.getenv("ASTRO_MODEL", "claude-haiku-5-5"))
    allowed_origins: list[str] = field(default_factory=_origins)
    rate_limit_per_minute: int = field(default_factory=lambda: int(os.getenv("RATE_LIMIT_PER_MINUTE", "20")))
    llm_timeout_seconds: float = field(default_factory=lambda: float(os.getenv("LLM_TIMEOUT_SECONDS", "20")))
    #: Most AI model calls per day (UTC), per server process. After that Astro answers in knowledge mode. 0 = no cap.
    llm_daily_cap: int = field(default_factory=lambda: int(os.getenv("LLM_DAILY_CAP", "500")))
    #: Look up NASA Image Library photos for "show me…" questions. Set NASA_IMAGES=off to disable.
    nasa_images: bool = field(default_factory=lambda: os.getenv("NASA_IMAGES", "on").lower() not in ("0", "off", "false", "no"))
    data_dir: Path = Path(__file__).resolve().parent / "data"

    @property
    def ai_mode(self) -> str:
        """'llm' when an AI model key is configured, otherwise the offline 'knowledge' mode."""
        return "llm" if self.anthropic_api_key else "knowledge"


def get_settings() -> Settings:
    return Settings()
