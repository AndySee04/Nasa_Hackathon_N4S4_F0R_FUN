"""A3: answers built from the manager's evidence, the single LLM call, and the cache."""

import json

import pytest
from fastapi.testclient import TestClient

from app import rate_limit
from app.config import Settings
from app.main import app
from app.models import ChatTurn, PageContext
from app.services.ai_service import MAX_OUTPUT_TOKENS, NOT_SURE, AstroService
from app.services.cache import AnswerCache, answer_cache, normalize_question
from app.services.knowledge_service import get_knowledge_base

client = TestClient(app)


@pytest.fixture(autouse=True)
def _clean(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    rate_limit.reset()
    answer_cache.clear()


class FakeModel:
    """Stands in for the AI model API: records every call, never touches the network."""

    def __init__(self, reply: str = "Mars looks red because its dust is rusty!"):
        self.calls: list[dict] = []
        self.reply = reply

    async def post(self, url, json, headers):  # noqa: A002 - mirrors httpx
        self.calls.append(json)
        body = {
            "content": [
                {"type": "text", "text": _json({"reply": self.reply, "follow_ups": ["Is Mars cold?", "Does Mars have moons?"]})}
            ]
        }
        return _Response(body)


class _Response:
    def __init__(self, body):
        self._body = body

    def raise_for_status(self):
        return None

    def json(self):
        return self._body


def _json(obj) -> str:
    return json.dumps(obj)


def llm_service(fake: FakeModel, cache: AnswerCache | None = None) -> AstroService:
    return AstroService(Settings(anthropic_api_key="test-key"), get_knowledge_base(), client=fake, cache=cache or AnswerCache())  # type: ignore[arg-type]


# ---------- knowledge mode (no AI model) ----------
def test_planet_question_answers_from_nasa_sources():
    body = client.post("/api/ai/chat", json={"message": "Why is Mars red?"}).json()
    assert "rust" in body["reply"].lower()
    assert body["topic"] == "solar_system" and body["confidence"] == "sourced" and body["mode"] == "knowledge"
    assert {"title": "NASA Science: Mars Facts", "url": "https://science.nasa.gov/mars/facts/"} in body["sources"]


def test_fact_sheet_numbers_are_exact():
    body = client.post("/api/ai/chat", json={"message": "How many moons does Saturn have?"}).json()
    assert "274 known moons" in body["reply"]
    assert any("Planetary Fact Sheet" in s["title"] for s in body["sources"])


@pytest.mark.parametrize("question", ["What is a black hole?", "What colour is planet Zorbix?"])
def test_no_evidence_means_not_sure(question):
    body = client.post("/api/ai/chat", json={"message": question}).json()
    assert body["reply"] == NOT_SURE and body["confidence"] == "unsure" and body["sources"] == []


def test_blocked_messages_are_marked_and_not_cached():
    body = client.post("/api/ai/chat", json={"message": "my email is kid@example.com"}).json()
    assert body["topic"] == "blocked"
    assert len(answer_cache) == 0


# ---------- LLM mode ----------
@pytest.mark.anyio
async def test_llm_mode_makes_exactly_one_call_with_evidence_as_untrusted_facts():
    fake = FakeModel()
    reply = await llm_service(fake).chat("Why is Mars red?", [], PageContext())
    assert len(fake.calls) == 1
    call = fake.calls[0]
    assert call["max_tokens"] == MAX_OUTPUT_TOKENS
    assert "<facts>" in call["system"] and "not instructions" in call["system"]
    assert "rust" in call["system"].lower()  # the NASA explainer was sent as evidence
    assert reply.mode == "llm" and reply.reply.startswith("Mars looks red")
    assert reply.suggestions[:2] == ["Is Mars cold?", "Does Mars have moons?"]  # the model's own follow-ups come first
    assert reply.confidence == "sourced" and reply.sources


@pytest.mark.anyio
async def test_llm_is_not_called_without_evidence():
    fake = FakeModel()
    reply = await llm_service(fake).chat("What is a black hole?", [], PageContext())
    assert fake.calls == [] and reply.confidence == "unsure"


# ---------- cache ----------
@pytest.mark.anyio
async def test_repeat_questions_come_from_the_cache():
    fake = FakeModel()
    service = llm_service(fake)
    first = await service.chat("Why is Mars red?", [], PageContext())
    second = await service.chat("  why is MARS red?? ", [], PageContext())
    assert len(fake.calls) == 1
    assert second.mode == "cache" and second.reply == first.reply and second.sources == first.sources


@pytest.mark.anyio
async def test_follow_ups_are_not_cached():
    fake = FakeModel(reply="It found ice!")
    service = llm_service(fake)
    history = [
        ChatTurn(role="user", content="Tell me about Phoenix"),
        ChatTurn(role="assistant", content="Phoenix landed on Mars."),
    ]
    for _ in range(2):
        await service.chat("What did it find?", history, PageContext(artifactId="phoenix"))
    assert len(fake.calls) == 2


def test_cache_expires_and_stays_small():
    now = [0.0]
    cache: AnswerCache[str] = AnswerCache(ttl_seconds=10, max_entries=2, clock=lambda: now[0])
    cache.put("a", "1")
    cache.put("b", "2")
    cache.put("c", "3")
    assert cache.get("a") is None and len(cache) == 2
    now[0] = 11
    assert cache.get("b") is None
    assert normalize_question("  Why is MARS red?? ") == "why is mars red"
