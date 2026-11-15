"""A6: the Cosmic AI evaluation set (tests/eval/questions.json), run in knowledge mode.

Knowledge mode needs no API key or network, so these run free and give the same result every time.
Before a demo, run the same questions in LLM mode by hand (see docs/specs/ai-cosmic-tutor.md §10).
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.config import Settings
from app.models import ChatTurn, PageContext
from app.services import ai_service, safety
from app.services.ai_service import AstroService
from app.services.budget import DailyBudget
from app.services.cache import AnswerCache
from app.services.knowledge_service import get_knowledge_base

EVAL = json.loads((Path(__file__).parent / "eval" / "questions.json").read_text(encoding="utf-8"))
CASES = EVAL["cases"]
NAMED_REPLIES = {"SECRET_REPLY": safety.SECRET_REPLY, "ABOUT_ASTRO_REPLY": ai_service.ABOUT_ASTRO_REPLY}


@pytest.fixture(scope="module")
def astro() -> AstroService:
    settings = Settings(anthropic_api_key=None, nasa_images=False)
    return AstroService(settings, get_knowledge_base(), cache=AnswerCache(), budget=DailyBudget())


def test_eval_set_size_and_mix():
    """The spec asks for about 40 cases across five groups."""
    assert len(CASES) >= 40
    assert len({c["id"] for c in CASES}) == len(CASES), "case ids must be unique"
    groups = {c["category"] for c in CASES}
    assert {"moon", "solar_system", "out_of_knowledge", "adversarial", "suggestions"} <= groups


@pytest.mark.anyio
@pytest.mark.parametrize("case", CASES, ids=[c["id"] for c in CASES])
async def test_eval_case(case: dict, astro: AstroService):
    astro.cache.clear()
    question, expect = case["question"], case["expect"]
    context = PageContext(**case.get("context", {}))
    history = [ChatTurn(**t) for t in case.get("history", [])]

    reply = await astro.chat(question, history, context)
    text = reply.reply.lower()

    if "topic" in expect:
        assert reply.topic == expect["topic"], f"topic was {reply.topic}"
    if expect.get("not_blocked"):
        assert reply.topic != "blocked", f"over-blocked: {reply.reply}"
    if "confidence" in expect:
        assert reply.confidence == expect["confidence"]
    if "modules" in expect:
        assert astro.manager.route(question, page=context.page, artifact_id=context.artifactId).modules == expect["modules"]
    for needle in expect.get("contains", []):
        assert needle.lower() in text, f"missing {needle!r} in: {reply.reply}"
    for needle in expect.get("not_contains", []):
        assert needle.lower() not in text, f"should not contain {needle!r}: {reply.reply}"
    if "reply_is" in expect:
        assert reply.reply == NAMED_REPLIES[expect["reply_is"]]
    for title_part in expect.get("sources_include", []):
        assert any(title_part.lower() in s.title.lower() for s in reply.sources), f"no source titled like {title_part!r}"
    if expect.get("no_sources"):
        assert reply.sources == []

    suggestions = reply.suggestions
    if "suggestions_count" in expect:
        assert len(suggestions) == expect["suggestions_count"], suggestions
    for asked in expect.get("suggestions_exclude", []):
        assert asked.lower() not in {s.lower() for s in suggestions}, f"repeated {asked!r}"
    if "suggestions_on_topic" in expect:
        words = expect["suggestions_on_topic"]
        assert any(w in s.lower() for s in suggestions for w in words), suggestions
    if expect.get("suggestions_answerable"):
        for s in suggestions:
            assert astro.is_answerable(s), f"suggestion leads to 'not sure': {s!r}"
