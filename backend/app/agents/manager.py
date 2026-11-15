"""Cosmic Agent Manager: a deterministic router (docs/specs/ai-cosmic-tutor.md §1).

question -> classify -> at most MAX_MODULES knowledge modules -> merged evidence.

Guarantees, enforced here and tested:
- no AI model call (that happens once, later, in the response step)
- at most MAX_MODULES modules per question, each run once
- delegation depth 1: modules never call other modules or the manager
- a time budget; anything slower is cut off and reported, never retried in a loop
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field

from app.agents.intent import MAX_TOPICS, Intent, classify
from app.agents.modules import MODULES, Confidence, ModuleResult
from app.services.retriever import Hit, Retriever, get_retriever

MAX_MODULES = MAX_TOPICS
#: Chunks handed to the response step. Keeps the AI prompt small and cheap.
MAX_EVIDENCE = 4
TIME_BUDGET_SECONDS = 1.0


@dataclass
class Route:
    intent: Intent
    modules: list[str]
    evidence: list[Hit] = field(default_factory=list)
    confidence: Confidence = "unsure"
    timed_out: bool = False
    elapsed_ms: float = 0.0

    @property
    def sources(self) -> list[dict]:
        """De-duplicated sources of the evidence, in order. All come from the source registry."""
        seen: dict[str, dict] = {}
        for hit in self.evidence:
            for s in hit.sources:
                seen.setdefault(s.url, {"title": s.title, "url": s.url})
        return list(seen.values())


class CosmicManager:
    def __init__(self, retriever: Retriever | None = None, time_budget: float = TIME_BUDGET_SECONDS):
        self.retriever = retriever or get_retriever()
        self.time_budget = time_budget

    def route(self, question: str, page: str | None = None, artifact_id: str | None = None) -> Route:
        start = time.perf_counter()
        intent = classify(question, page=page, artifact_id=artifact_id)
        names = [t if t in MODULES else "general" for t in intent.topics][:MAX_MODULES]
        route = Route(intent=intent, modules=[])

        results: list[ModuleResult] = []
        for name in names:
            if time.perf_counter() - start > self.time_budget:
                route.timed_out = True
                break
            results.append(MODULES[name].run(self.retriever, question))
            route.modules.append(name)

        route.evidence = self._merge(results, intent.artifact_ids)
        if route.evidence:
            route.confidence = "sourced" if any(h.sources for h in route.evidence) else "general_knowledge"
        route.elapsed_ms = (time.perf_counter() - start) * 1000
        return route

    @staticmethod
    def _merge(results: list[ModuleResult], artifact_ids: list[str]) -> list[Hit]:
        """Best evidence across modules: named artifacts first, then by score, one hit per document."""
        best: dict[str, Hit] = {}
        for r in results:
            for h in r.evidence:
                if h.doc_id not in best or h.score > best[h.doc_id].score:
                    best[h.doc_id] = h
        wanted = set(artifact_ids)
        ranked = sorted(best.values(), key=lambda h: (h.doc_id not in wanted, -h.score))
        return ranked[:MAX_EVIDENCE]
