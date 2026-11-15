"""Contextual next questions (docs/specs/ai-cosmic-tutor.md §5).

Order of preference:
  1. follow-ups written by the AI model in the same call (no extra cost), then
  2. the topic graph in kb/suggestions.json for the document that answered, then
  3. the graph's questions for the topic, then the page's starter questions.

Filters: nothing the child already asked (this question, the conversation, or the
game's askedQuestions), no near-duplicates, and only questions the knowledge base can
actually answer, so a suggested question never leads to "I'm not sure".
"""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

from app.services.cache import normalize_question

MAX_SUGGESTIONS = 3
GRAPH_FILE = Path(__file__).resolve().parents[1] / "kb" / "suggestions.json"
_STOP = {"what", "is", "a", "an", "the", "how", "why", "does", "do", "did", "of", "on", "to", "in", "are", "it", "its"}


@lru_cache(maxsize=1)
def load_graph() -> dict:
    return json.loads(GRAPH_FILE.read_text(encoding="utf-8"))


def _key_words(text: str) -> frozenset[str]:
    return frozenset(w for w in re.findall(r"[a-z0-9]+", text.lower()) if w not in _STOP)


def too_similar(a: str, b: str, threshold: float = 0.75) -> bool:
    """True for the same question in other words: 'How big is the Moon?' vs 'how big is our moon'."""
    wa, wb = _key_words(a), _key_words(b)
    if not wa or not wb:
        return normalize_question(a) == normalize_question(b)
    return len(wa & wb) / len(wa | wb) >= threshold


def candidates(
    doc_ids: list[str], topic: str | None, page_questions: list[str], model_follow_ups: list[str] | None = None
) -> list[str]:
    graph = load_graph()
    out: list[str] = list(model_follow_ups or [])
    for doc_id in doc_ids:
        out += graph["documents"].get(doc_id, [])
    if topic:
        out += graph["topics"].get(topic, [])
    out += page_questions
    return out


def pick(
    options: list[str],
    *,
    asked: list[str],
    answerable,
    limit: int = MAX_SUGGESTIONS,
) -> list[str]:
    """First `limit` options that are new, not repeats of each other, short, and answerable."""
    chosen: list[str] = []
    for q in options:
        q = q.strip()
        if not q or len(q) > 90 or not q.endswith("?"):
            continue
        if any(too_similar(q, prev) for prev in [*asked, *chosen]):
            continue
        if not answerable(q):
            continue
        chosen.append(q)
        if len(chosen) == limit:
            break
    return chosen
