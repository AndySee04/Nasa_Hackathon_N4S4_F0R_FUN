"""A4: contextual follow-up suggestions."""

import json

import pytest
from fastapi.testclient import TestClient

from app import rate_limit
from app.agents.manager import CosmicManager
from app.agents.suggestions import GRAPH_FILE, MAX_SUGGESTIONS, pick, too_similar
from app.config import Settings
from app.main import app
from app.models import ChatTurn, PageContext
from app.services.ai_service import AstroService
from app.services.cache import AnswerCache, answer_cache
from app.services.knowledge_service import get_knowledge_base

client = TestClient(app)


@pytest.fixture(autouse=True)
def _clean(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setenv("NASA_IMAGES", "off")
    rate_limit.reset()
    answer_cache.clear()


@pytest.fixture(scope="module")
def manager() -> CosmicManager:
    return CosmicManager()


def ask(message: str, **context) -> dict:
    r = client.post("/api/ai/chat", json={"message": message, "context": context})
    assert r.status_code == 200, r.text
    return r.json()


# ---------- the topic graph ----------
def test_every_graph_question_can_be_answered(manager):
    graph = json.loads(GRAPH_FILE.read_text())
    questions = {q for group in ("documents", "topics") for qs in graph[group].values() for q in qs}
    unanswerable = [q for q in sorted(questions) if not manager.route(q).evidence]
    assert unanswerable == []


def test_every_graph_key_is_a_real_document_or_topic(manager):
    graph = json.loads(GRAPH_FILE.read_text())
    assert [k for k in graph["documents"] if manager.retriever.document_hit(k) is None] == []
    assert set(graph["topics"]) <= {"solar_system", "missions", "deep_space", "general"}


# ---------- chat suggestions ----------
def test_suggestions_follow_the_answer():
    body = ask("Why is Mars red?")
    assert len(body["suggestions"]) == MAX_SUGGESTIONS
    assert body["suggestions"][0] == "How many moons does Mars have?"
    assert not any(too_similar(s, "Why is Mars red?") for s in body["suggestions"])


def test_already_asked_questions_are_not_suggested_again():
    first = ask("Why is Mars red?")["suggestions"]
    second = ask("Why is Mars red?", askedQuestions=first[:2])["suggestions"]
    assert not set(first[:2]) & set(second)
    assert len(second) == MAX_SUGGESTIONS


def test_conversation_history_counts_as_asked():
    r = client.post(
        "/api/ai/chat",
        json={"message": "Why is Mars red?", "history": [{"role": "user", "content": "How many moons does Mars have?"}]},
    )
    assert "How many moons does Mars have?" not in r.json()["suggestions"]


def test_not_sure_answers_still_offer_answerable_questions(manager):
    body = ask("What is a black hole?")
    assert body["confidence"] == "unsure" and body["suggestions"]
    assert all(manager.route(q).evidence for q in body["suggestions"])


def test_asked_questions_are_limited():
    r = client.post("/api/ai/chat", json={"message": "Hi?", "context": {"askedQuestions": ["Q?"] * 11}})
    assert r.status_code == 422


@pytest.mark.anyio
async def test_model_follow_ups_are_kept_only_if_answerable():
    class Model:
        calls = 0

        async def post(self, url, json, headers):  # noqa: A002
            Model.calls += 1
            text = '{"reply": "Rusty dust!", "follow_ups": ["What is a black hole?", "How long is a day on Mars?"]}'
            return type(
                "R",
                (),
                {"raise_for_status": lambda self: None, "json": lambda self: {"content": [{"type": "text", "text": text}]}},
            )()

    service = AstroService(Settings(anthropic_api_key="k"), get_knowledge_base(), client=Model(), cache=AnswerCache())  # type: ignore[arg-type]
    reply = await service.chat("Why is Mars red?", [], PageContext())
    assert "What is a black hole?" not in reply.suggestions
    assert reply.suggestions[0] == "How long is a day on Mars?"
    # A cached repeat filters the stored options again for the next child, with no new model call.
    again = await service.chat("Why is Mars red?", [ChatTurn(role="user", content="How long is a day on Mars?")], PageContext())
    assert again.mode == "cache" and "How long is a day on Mars?" not in again.suggestions and Model.calls == 1


# ---------- helpers ----------
def test_similarity_and_picking():
    assert too_similar("How big is the Moon?", "how big is the moon")
    assert not too_similar("How big is the Moon?", "How big is Jupiter?")
    options = ["How big is the Moon?", "how big is the moon?", "Not a question", "x" * 95 + "?", "Why is Mars red?"]
    assert pick(options, asked=[], answerable=lambda q: True) == ["How big is the Moon?", "Why is Mars red?"]
    assert pick(options, asked=["Why is Mars red?"], answerable=lambda q: True) == ["How big is the Moon?"]
