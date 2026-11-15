"""Shared test setup."""

import pytest


@pytest.fixture(autouse=True)
def _no_real_ai_keys(monkeypatch):
    """Tests never call a real AI service, even if a developer's backend/.env holds a key.

    Tests that need LLM mode pass a fake key and a fake HTTP client explicitly.
    """
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
