"""Knowledge modules: the "specialist agents" of the spec, as plain code.

Each module only searches its own part of the knowledge base and never calls another
module, so delegation is always one level deep. None of them call an AI model.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from app.services.retriever import Hit, Retriever

Confidence = Literal["sourced", "general_knowledge", "unsure"]

#: A hit counts as evidence if a question word names it, or its BM25 score is at least this.
MIN_EVIDENCE_SCORE = 6.0


@dataclass
class ModuleResult:
    module: str
    hits: list[Hit] = field(default_factory=list)

    @property
    def evidence(self) -> list[Hit]:
        """Hits strong enough to answer from. Loose word overlaps are dropped, so 'I'm not sure' beats a guess.

        A glossary entry only counts when the question uses its word: "hole" in the definition of
        crater says nothing about black holes.
        """
        return [h for h in self.hits if h.name_matches > 0 or (h.kind != "glossary" and h.score >= MIN_EVIDENCE_SCORE)]

    @property
    def confidence(self) -> Confidence:
        ev = self.evidence
        if not ev:
            return "unsure"
        return "sourced" if any(h.sources for h in ev) else "general_knowledge"


@dataclass(frozen=True)
class KnowledgeModule:
    name: str
    topics: frozenset[str] | None = None
    categories: frozenset[str] | None = None

    def run(self, retriever: Retriever, question: str, k: int = 4) -> ModuleResult:
        hits = retriever.search(
            question,
            topics=set(self.topics) if self.topics else None,
            categories=set(self.categories) if self.categories else None,
            k=k,
        )
        return ModuleResult(self.name, hits)


#: The glossary is shared: any module may explain a word, so it joins every topic search.
_WITH_GLOSSARY = lambda *t: frozenset({*t, "general"})  # noqa: E731

SOLAR_SYSTEM = KnowledgeModule("solar_system", topics=_WITH_GLOSSARY("solar_system"))
MISSIONS = KnowledgeModule("missions", topics=_WITH_GLOSSARY("missions"))
DEEP_SPACE = KnowledgeModule("deep_space", topics=_WITH_GLOSSARY("deep_space"))
GENERAL = KnowledgeModule("general")

MODULES: dict[str, KnowledgeModule] = {m.name: m for m in (SOLAR_SYSTEM, MISSIONS, DEEP_SPACE, GENERAL)}
