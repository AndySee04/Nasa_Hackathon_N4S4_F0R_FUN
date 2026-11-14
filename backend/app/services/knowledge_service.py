"""Mission knowledge base and simple keyword retrieval.

Astro AI answers mission questions from the same verified JSON records the website shows.
Retrieval is deliberately simple (keyword scoring, no vector database) so it is transparent,
fast and easy for a hackathon team to debug.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

STOPWORDS = {
    "the", "and", "for", "what", "why", "how", "did", "does", "was", "were", "are", "is", "its", "it's",
    "who", "when", "where", "which", "about", "tell", "me", "you", "your", "can", "with", "that", "this",
    "from", "into", "they", "them", "there", "have", "has", "had", "simple", "words", "please", "explain",
    "mean", "means", "still", "cool", "fact", "a", "an", "of", "to", "in", "on", "do", "be",
}

GENERIC_NAME_WORDS = {"lander", "rover", "lunar", "module", "descent", "stage", "vehicle", "mission", "mars", "moon", "the"}


def tokenize(text: str) -> list[str]:
    return [t for t in re.findall(r"[a-z0-9]+", text.lower()) if len(t) > 1 and t not in STOPWORDS]


@dataclass
class Doc:
    kind: str  # "artifact" or "glossary"
    id: str
    title: str
    text: str
    sources: list[dict] = field(default_factory=list)
    keywords: set[str] = field(default_factory=set)
    name_tokens: set[str] = field(default_factory=set)
    phrases: list[str] = field(default_factory=list)


class KnowledgeBase:
    def __init__(self, data_dir: Path):
        self.artifacts: list[dict] = json.loads((data_dir / "artifacts.json").read_text(encoding="utf-8"))
        self.glossary: list[dict] = json.loads((data_dir / "glossary.json").read_text(encoding="utf-8"))
        self.by_id = {a["id"]: a for a in self.artifacts}
        self.docs: list[Doc] = [self._artifact_doc(a) for a in self.artifacts] + [self._glossary_doc(g) for g in self.glossary]

    # ---------- document building ----------
    @staticmethod
    def _artifact_doc(a: dict) -> Doc:
        parts = [
            f"{a['name']} ({a['missionName']}), built by {a['agency']}. Type: {a['hardwareType']}. World: {a['world']}.",
            f"Launched {a['launchDate']}." + (f" Arrived/landed {a['arrivalDate']}." if a.get("arrivalDate") else "")
            + (f" Last contact or end: {a['endDate']}." if a.get("endDate") else " Still active."),
            f"Status: {a['status']}. {a['statusNote']}",
            f"Location: {a['location']['description']}." + (f" Trajectory: {a['trajectory']}" if a.get("trajectory") else ""),
            "Story: " + " ".join(a["story"]),
            "Objectives: " + "; ".join(a["objectives"]),
            "Instruments: " + "; ".join(f"{i['name']}: {i['purpose']}" for i in a["instruments"]),
            "Discoveries: " + "; ".join(a["discoveries"]),
            f"Fun fact: {a['funFact']}",
        ]
        text = "\n".join(parts)
        name_tokens = {t for t in tokenize(f"{a['name']} {a['missionName']} {a['id']}") if t not in GENERIC_NAME_WORDS}
        return Doc(
            kind="artifact",
            id=a["id"],
            title=a["name"],
            text=text,
            sources=a["sources"],
            keywords=set(tokenize(text)),
            name_tokens=name_tokens,
        )

    @staticmethod
    def _glossary_doc(g: dict) -> Doc:
        text = f"{g['term']}: {g['definition']} Analogy: {g['analogy']}"
        phrases = [g["term"].lower(), *[x.lower() for x in g.get("aliases", [])]]
        return Doc(
            kind="glossary",
            id=g["term"].lower(),
            title=g["term"],
            text=text,
            keywords=set(tokenize(text)),
            name_tokens=set(tokenize(" ".join(phrases))),
            phrases=phrases,
        )

    # ---------- lookups ----------
    def artifact(self, artifact_id: str | None) -> dict | None:
        return self.by_id.get(artifact_id or "")

    def glossary_entry(self, query: str) -> dict | None:
        q = f" {query.lower().strip()} "
        best: tuple[int, dict] | None = None
        for g in self.glossary:
            for phrase in [g["term"], *g.get("aliases", [])]:
                p = phrase.lower()
                if re.search(rf"(?<![a-z]){re.escape(p)}(?![a-z])", q):
                    if best is None or len(p) > best[0]:
                        best = (len(p), g)
        return best[1] if best else None

    def search(self, query: str, context_artifact_id: str | None = None, k: int = 3) -> list[Doc]:
        q_tokens = set(tokenize(query))
        q_lower = query.lower()
        scored: list[tuple[float, Doc]] = []
        for doc in self.docs:
            score = 0.0
            score += 6.0 * len(q_tokens & doc.name_tokens)
            if doc.kind == "glossary" and any(re.search(rf"(?<![a-z]){re.escape(p)}(?![a-z])", q_lower) for p in doc.phrases):
                score += 8.0
            score += 1.0 * len(q_tokens & doc.keywords)
            if doc.kind == "artifact" and doc.id == context_artifact_id and score > 0:
                score += 3.0
            if score > 0:
                scored.append((score, doc))
        scored.sort(key=lambda s: s[0], reverse=True)
        top = [d for s, d in scored if s >= 3.0][:k]
        return top


@lru_cache(maxsize=1)
def get_knowledge_base() -> KnowledgeBase:
    from app.config import get_settings

    return KnowledgeBase(get_settings().data_dir)
