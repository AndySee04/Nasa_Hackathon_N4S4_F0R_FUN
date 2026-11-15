"""OpenRouter as the AI model provider (one key, many models)."""

from __future__ import annotations

import json

import pytest

from app.config import Settings
from app.models import PageContext
from app.services.ai_service import ANTHROPIC_URL, MAX_OUTPUT_TOKENS, OPENROUTER_URL, AstroService
from app.services.budget import DailyBudget
from app.services.cache import AnswerCache
from app.services.knowledge_service import get_knowledge_base


class FakeOpenRouter:
    """Answers like OpenRouter's chat completions API; records every call and never touches the network."""

    def __init__(self, content: str | None):
        self.calls: list[tuple[str, dict, dict]] = []
        self.content = content

    async def post(self, url, json, headers):  # noqa: A002 - mirrors httpx
        self.calls.append((url, json, headers))
        return _Response({"choices": [{"message": {"role": "assistant", "content": self.content}}]})


class _Response:
    def __init__(self, body):
        self._body = body

    def raise_for_status(self):
        return None

    def json(self):
        return self._body


def service(fake: FakeOpenRouter, **settings) -> AstroService:
    s = Settings(anthropic_api_key=None, openrouter_api_key="or-test-key", nasa_images=False, **settings)
    return AstroService(s, get_knowledge_base(), client=fake, cache=AnswerCache(), budget=DailyBudget())  # type: ignore[arg-type]


def test_provider_is_picked_from_the_key_that_is_set():
    assert Settings(anthropic_api_key=None, openrouter_api_key=None).llm_provider is None
    assert Settings(anthropic_api_key=None, openrouter_api_key=None).ai_mode == "knowledge"
    assert Settings(anthropic_api_key=None, openrouter_api_key="k").llm_provider == "openrouter"
    assert Settings(anthropic_api_key=None, openrouter_api_key="k").ai_mode == "llm"
    # Both set: Anthropic wins, so adding an OpenRouter key never silently changes a working setup.
    assert Settings(anthropic_api_key="a", openrouter_api_key="k").llm_provider == "anthropic"


@pytest.mark.anyio
async def test_one_openrouter_call_in_chat_format_with_facts_as_untrusted_data():
    fake = FakeOpenRouter(json.dumps({"reply": "Mars looks red because its dust is rusty!", "follow_ups": ["Is Mars cold?"]}))
    reply = await service(fake, openrouter_model="google/gemma-4-31b-it:free").chat("Why is Mars red?", [], PageContext())

    assert len(fake.calls) == 1
    url, payload, headers = fake.calls[0]
    assert url == OPENROUTER_URL and url != ANTHROPIC_URL
    assert headers["Authorization"] == "Bearer or-test-key"
    assert payload["model"] == "google/gemma-4-31b-it:free" and payload["max_tokens"] == MAX_OUTPUT_TOKENS
    system, user = payload["messages"][0], payload["messages"][-1]
    assert system["role"] == "system" and "<facts>" in system["content"] and "rust" in system["content"].lower()
    assert user == {"role": "user", "content": "Why is Mars red?"}

    assert reply.mode == "llm" and reply.reply.startswith("Mars looks red")
    assert reply.suggestions[0] == "Is Mars cold?"


@pytest.mark.anyio
async def test_default_model_is_claude_haiku_on_openrouter():
    fake = FakeOpenRouter(json.dumps({"reply": "The Moon is about 3,475 km across.", "follow_ups": []}))
    await service(fake).chat("How big is the Moon?", [], PageContext())
    assert fake.calls[0][1]["model"] == "anthropic/claude-haiku-5.5"


@pytest.mark.anyio
async def test_plain_text_replies_from_models_that_ignore_json_still_work():
    fake = FakeOpenRouter("Mars is red because of rusty iron in its dust.")
    reply = await service(fake).chat("Why is Mars red?", [], PageContext())
    assert reply.mode == "llm" and reply.reply == "Mars is red because of rusty iron in its dust."


@pytest.mark.anyio
async def test_an_empty_reply_falls_back_to_knowledge_mode():
    fake = FakeOpenRouter(None)
    reply = await service(fake).chat("Why is Mars red?", [], PageContext())
    assert len(fake.calls) == 1
    assert reply.mode == "knowledge" and "rust" in reply.reply.lower()
