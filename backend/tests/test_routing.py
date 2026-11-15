"""A2: topic classifier and Cosmic Agent Manager."""

import pytest

from app.agents import manager as manager_module
from app.agents.intent import MAX_TOPICS, classify, named_artifacts
from app.agents.manager import MAX_EVIDENCE, CosmicManager
from app.agents.modules import MODULES, KnowledgeModule
from app.kb.build import build_database
from app.services.retriever import Retriever


@pytest.fixture(scope="module")
def manager() -> CosmicManager:
    return CosmicManager(Retriever(build_database(":memory:")))


# ---------- classifier ----------
@pytest.mark.parametrize(
    ("question", "topics"),
    [
        ("Why is Mars red?", ["solar_system"]),
        ("How many moons does Jupiter have?", ["solar_system"]),
        ("What is a black hole?", ["deep_space"]),
        ("Tell me about the Andromeda galaxy", ["deep_space"]),
        ("Did Surveyor 3 meet astronauts?", ["missions"]),
        ("Where is Voyager 1 now?", ["missions"]),
        ("What did Mars Pathfinder find?", ["missions"]),
        ("Hello!", ["general"]),
    ],
)
def test_topics(question, topics):
    assert classify(question).topics == topics


def test_mixed_question_gets_two_topics_never_more():
    intent = classify("Why is the Moon grey, which rovers went there, and is it near a black hole galaxy?")
    assert len(intent.topics) == MAX_TOPICS == 2
    assert set(intent.topics) <= {"solar_system", "missions", "deep_space"}


def test_page_context_is_a_fallback_only():
    assert classify("Tell me more!", artifact_id="voyager-1").topics == ["missions"]
    assert classify("Tell me more!", artifact_id="voyager-1").artifact_ids == ["voyager-1"]
    assert classify("Tell me more!", page="moon-campaign").topics == ["solar_system"]
    # A clear question wins over the page the child happens to be on.
    assert classify("Why is Mars red?", artifact_id="voyager-1").topics == ["solar_system"]


def test_visual_requests_are_flagged():
    assert classify("Show me a picture of Saturn").visual
    assert classify("What does Surveyor 3 look like?").visual
    assert not classify("How big is Saturn?").visual


def test_named_artifacts_prefers_the_numbered_name():
    assert named_artifacts("What did Apollo 11 leave behind?") == ["apollo-11-eagle"]
    assert named_artifacts("Is Voyager 2 still working?") == ["voyager-2"]
    assert "surveyor-3" in named_artifacts("Surveyor 3")
    assert named_artifacts("Why is the sky blue?") == []


# ---------- manager ----------
def test_mars_red_uses_only_the_solar_system_module(manager, monkeypatch):
    called = []
    for name, module in MODULES.items():
        monkeypatch.setitem(MODULES, name, _spy(module, called))
    route = manager.route("Why is Mars red?")
    assert route.modules == ["solar_system"] and called == ["solar_system"]
    assert route.evidence[0].doc_id == "why-mars-is-red"
    assert route.confidence == "sourced"
    assert {"title": "NASA Science: Mars Facts", "url": "https://science.nasa.gov/mars/facts/"} in route.sources


def test_named_artifact_comes_first(manager):
    route = manager.route("Did Surveyor 3 meet astronauts?")
    assert route.evidence[0].doc_id == "surveyor-3"
    assert all(s["url"].startswith("https://") and ".nasa.gov/" in s["url"] for s in route.sources)


def test_unknown_topics_are_unsure_not_guessed(manager):
    for q in ("What is a black hole?", "What colour is planet Zorbix?"):
        route = manager.route(q)
        assert route.confidence == "unsure", (q, [h.doc_id for h in route.evidence])
        assert route.evidence == [] and route.sources == []


def test_page_context_answers_a_vague_follow_up(manager):
    route = manager.route("How far away is it?", artifact_id="voyager-1")
    assert route.modules == ["missions"]


def test_limits_are_enforced(manager, monkeypatch):
    called = []
    for name, module in MODULES.items():
        monkeypatch.setitem(MODULES, name, _spy(module, called))
    route = manager.route("Why is the Moon grey, which rovers went there, and is it near a black hole galaxy?")
    assert len(route.modules) <= manager_module.MAX_MODULES == 2
    assert len(called) == len(set(called)) == len(route.modules)  # each module runs once
    assert len(route.evidence) <= MAX_EVIDENCE
    assert len({h.doc_id for h in route.evidence}) == len(route.evidence)


def test_time_budget_stops_work_instead_of_looping(manager):
    slow = CosmicManager(manager.retriever, time_budget=-1)
    route = slow.route("Why is the Moon grey and which rovers went there?")
    assert route.timed_out and route.modules == [] and route.confidence == "unsure"


def test_routing_is_fast(manager):
    route = manager.route("How many moons does Saturn have?")
    assert route.elapsed_ms < 100
    assert route.evidence[0].doc_id == "factsheet-saturn"


def _spy(module: KnowledgeModule, called: list[str]) -> KnowledgeModule:
    class Spy(KnowledgeModule):
        def run(self, retriever, question, k=4):
            called.append(self.name)
            return super().run(retriever, question, k)

    return Spy(module.name, module.topics, module.categories)
