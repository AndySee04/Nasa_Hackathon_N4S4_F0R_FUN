"""Knowledge mode: pick the sentences of a NASA-sourced record that answer the question.

No AI model is involved. The question's words (plus a few everyday synonyms a child might use, such as
"big" for "across") are matched against each sentence, and the best one or two sentences are returned
word for word. Nothing is reworded, so every number still traces to the record and its sources.
"""

from __future__ import annotations

import re
from datetime import date

#: Question words that say nothing about what is being asked.
STOP = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "do", "does", "did", "of", "in", "on", "at", "to",
    "for", "from", "and", "or", "it", "its", "this", "that", "what", "who", "whom", "which", "why", "how", "when",
    "where", "can", "could", "would", "will", "you", "me", "tell", "about", "there", "they", "their", "have", "has",
    "had", "with", "by", "into", "any", "some", "much", "many", "very", "really", "please", "i", "we", "us",
}  # fmt: skip

#: Everyday words children use, mapped to the words NASA records use for the same idea.
SYNONYMS: dict[str, set[str]] = {
    "big": {"across", "diameter", "size", "wide", "radius"},
    "size": {"across", "diameter", "wide", "radius"},
    "wide": {"across", "diameter"},
    "far": {"km", "distance", "away", "drove", "driven"},
    "drive": {"drove", "driven", "km"},
    "meet": {"visited", "visit", "astronauts"},
    "visit": {"visited", "astronauts"},
    "pictures": {"images", "photos", "pictures"},
    "photos": {"images", "pictures"},
    "take": {"took", "taken", "sent"},
    "bring": {"brought", "samples", "collected", "kg"},
    "collect": {"collected", "samples", "kg"},
    "rocks": {"samples", "kg"},
    "hot": {"°c", "temperature", "hottest"},
    "cold": {"°c", "temperature", "coldest"},
    "heavy": {"kg", "mass"},
    "old": {"years", "billion"},
    "crash": {"crashed", "impact", "impacted"},
    "fly": {"flew", "crew", "orbited"},
    "flew": {"crew", "orbited"},
}

#: Questions that ask for a number. Sentences with a number get a small bonus for them.
QUANTITY = re.compile(r"\b(how (many|much|far|big|long|heavy|hot|cold|old|fast|tall|wide)|when|what year)\b", re.I)

_WORD = re.compile(r"[a-z0-9°]+(?:[.,][0-9]+)*", re.I)
_SENTENCE_END = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9])")


def _stem(word: str) -> str:
    """Rough stemming so 'pictures' meets 'picture' and 'landed' meets 'landing'."""
    w = word.lower()
    return w[:5] if len(w) > 5 else w.rstrip("s")


def _terms(text: str) -> set[str]:
    return {_stem(w) for w in _WORD.findall(text)}


def sentences(text: str) -> list[str]:
    out: list[str] = []
    for para in re.split(r"\n+", text):
        out += [s.strip(" •-") for s in _SENTENCE_END.split(para.strip()) if len(s.strip()) >= 15]
    return out


def best_sentences(question: str, candidates: list[str], name_words: set[str] = frozenset(), k: int = 2) -> list[str]:
    """The k sentences that best answer the question, best first. Empty if nothing matches well enough.

    `name_words` are words naming the thing asked about ("surveyor", "moon"): every sentence of its record
    mentions them, so they don't help choose between sentences.
    """
    ranked = rank_sentences(question, candidates, name_words)
    if not ranked:
        return []
    top = ranked[0][0]
    # Keep a second sentence only if it is nearly as relevant as the first.
    return [s for score, s in ranked[:k] if score >= max(1, top - 0.5)]


def rank_sentences(question: str, candidates: list[str], name_words: set[str] = frozenset()) -> list[tuple[float, str]]:
    """(score, sentence) pairs that match the question, best first; ties keep reading order."""
    ignore = {_stem(w) for w in name_words} | {_stem(w) for w in STOP}
    asked = [w.lower() for w in _WORD.findall(question) if w.lower() not in STOP]
    wanted: set[str] = set()
    for w in asked:
        wanted |= {_stem(w)} | {_stem(s) for s in SYNONYMS.get(w, ())}
    wanted -= ignore
    wanted = {w for w in wanted if not w.isdigit()}
    if not wanted:
        return []
    candidates = list(candidates)
    numeric = bool(QUANTITY.search(question))

    scored: list[tuple[float, int, str]] = []
    for i, s in enumerate(dict.fromkeys(candidates)):
        hits = len(wanted & _terms(s))
        if not hits:
            continue
        score = hits + (0.5 if numeric and re.search(r"\d", s) else 0)
        scored.append((score, -i, s))
    scored.sort(reverse=True)
    return [(score, s) for score, _, s in scored]


def _human_date(iso: str) -> str:
    try:
        d = date.fromisoformat(iso)
    except ValueError:
        return iso
    return f"{d.day} {d.strftime('%B %Y')}"


def artifact_sentences(a: dict) -> list[str]:
    """Every sentence in an artifact record that could answer a question, in reading order."""
    parts: list[str] = [*a.get("story", []), *a.get("discoveries", []), a.get("statusNote", ""), a.get("funFact", "")]
    parts += [f"{t['label']} ({_human_date(t['date'])})." for t in a.get("timeline", []) if t.get("label") and t.get("date")]
    if a.get("trajectory"):
        parts.append(a["trajectory"])
    out: list[str] = []
    for p in parts:
        out += sentences(p)
    return out
