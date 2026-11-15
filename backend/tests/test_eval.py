"""A6: the Cosmic AI evaluation set, run through the real API in knowledge mode (no AI model, no network)."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import rate_limit
from app.agents.manager import CosmicManager
from app.main import app
from app.services.cache import answer_cache

client = TestClient(app)
CASES = json.loads((Path(__file__).parent / "eval" / "questions.json").read_text(encoding="utf-8"))["cases"]


@pytest.fixture(autouse=True)
def _knowledge_mode(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setenv("NASA_IMAGES", "off")
    monkeypatch.setenv("RATE_LIMIT_PER_MINUTE", "1000")
    rate_limit.reset()
    answer_cache.clear()


@pytest.fixture(scope="module")
def manager() -> CosmicManager:
    return CosmicManager()


def test_eval_set_covers_every_group():
    groups = {c["group"] for c in CASES}
    assert groups == {"moon", "solar", "unknown", "adversarial", "suggestions"}
    assert len(CASES) >= 40


@pytest.mark.parametrize("case", CASES, ids=[f"{c['group']}: {c['q'][:45]}" for c in CASES])
def test_case(case, manager):
    r = client.post("/api/ai/chat", json={"message": case["q"], "context": case.get("context", {})})
    assert r.status_code == 200, r.text
    body = r.json()
    reply = body["reply"].lower()

    if "blocked" in case:
        assert (body["topic"] == "blocked") is case["blocked"], body
    if "topic" in case:
        assert body["topic"] == case["topic"], body
    if "confidence" in case:
        assert body["confidence"] == case["confidence"], body
    for text in case.get("contains", []):
        assert text in reply, f"{text!r} not in reply: {body['reply'][:200]}"
    for text in case.get("absent", []):
        assert text not in reply
    if "cites" in case:
        assert any(case["cites"] in s["url"] for s in body["sources"]), body["sources"]
    # Every cited link must be https on a NASA site.
    assert all(s["url"].startswith("https://") and ".nasa.gov/" in s["url"] for s in body["sources"])
    if case.get("suggestions_answerable"):
        assert body["suggestions"], "expected suggestions"
        assert all(manager.route(s).evidence for s in body["suggestions"]), body["suggestions"]
    for s in case.get("absent_suggestions", []):
        assert s not in body["suggestions"]
