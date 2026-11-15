"""Rule-based topic classifier for Cosmic AI (docs/specs/ai-cosmic-tutor.md §3).

No AI model is used here: rules are free, instant, predictable and easy to test.
The safety filter has already run before a question reaches this step.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Literal

Topic = Literal["solar_system", "missions", "deep_space", "general"]

#: Most topics a single question may be routed to. A mixed question gets two; never more.
MAX_TOPICS = 2

VISUAL = re.compile(r"\b(show me|picture|pictures|photo|photos|image|images|what does .{1,40} look like|see what)\b", re.I)

SOLAR_SYSTEM_WORDS = {
    "sun", "mercury", "venus", "earth", "moon", "moons", "lunar", "mars", "martian", "jupiter", "saturn", "uranus",
    "neptune", "pluto", "planet", "planets", "solar", "crater", "craters", "ring", "rings", "orbit", "gravity",
    "eclipse", "tide", "tides", "phase", "phases", "maria",
}  # fmt: skip
DEEP_SPACE_WORDS = {
    "nebula", "nebulae", "galaxy", "galaxies", "exoplanet", "exoplanets", "kepler", "constellation", "constellations",
    "asteroid", "asteroids", "comet", "comets", "meteor", "meteors", "meteorite", "universe", "supernova", "stars",
    "quasar", "pulsar", "cosmos",
}  # fmt: skip
DEEP_SPACE_PHRASES = ("black hole", "milky way", "light year", "light-year", "big bang", "dark matter", "neutron star")
MISSION_WORDS = {
    "mission", "missions", "rover", "rovers", "lander", "landers", "probe", "probes", "spacecraft", "astronaut",
    "astronauts", "launch", "launched", "landed", "landing", "nasa", "apollo", "module", "orbiter", "seismometer",
    "retroreflector", "experiment", "experiments", "instrument", "instruments", "crew",
}  # fmt: skip
# Words in artifact names that say nothing about which machine is meant.
GENERIC = {
    "the",
    "of",
    "and",
    "lunar",
    "module",
    "descent",
    "stage",
    "vehicle",
    "roving",
    "lander",
    "rover",
    "probe",
    "mars",
    "moon",
}


@dataclass
class Intent:
    topics: list[Topic]
    visual: bool = False
    #: Words or names that triggered each topic, for debugging and tests.
    reasons: dict[str, list[str]] = field(default_factory=dict)
    #: Artifact ids named in the question (or taken from the page the child is on).
    artifact_ids: list[str] = field(default_factory=list)


def _words(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+(?:-[a-z0-9]+)?", text.lower())


@lru_cache(maxsize=1)
def _artifact_names() -> dict[str, set[str]]:
    """Distinctive name words for every artifact, e.g. 'voyager-1' -> {'voyager', 'voyager 1'}."""
    data = json.loads((Path(__file__).resolve().parents[1] / "data" / "artifacts.json").read_text(encoding="utf-8"))
    names: dict[str, set[str]] = {}
    for a in data:
        phrases: set[str] = set()
        for text in (a["name"], a["missionName"], a["id"].replace("-", " ")):
            words = _words(text)
            phrases |= {w for w in words if w not in GENERIC and not w.isdigit() and len(w) > 2}
            # Keep "apollo 11", "voyager 1", "surveyor 3" together, so the number counts.
            phrases |= {f"{w} {n}" for w, n in zip(words, words[1:], strict=False) if n.isdigit()}
        names[a["id"]] = phrases
    return names


def named_artifacts(question: str) -> list[str]:
    """Artifacts the question names, best match first. A name with its number ('apollo 12') beats a bare family name."""
    text = " ".join(_words(question))
    padded = f" {text} "
    scored = []
    for aid, phrases in _artifact_names().items():
        hits = [p for p in phrases if f" {p} " in padded]
        if hits:
            scored.append((max(len(p.split()) for p in hits) * 10 + len(hits), aid))
    if not scored:
        return []
    best = max(s for s, _ in scored)
    # A bare family word ("apollo") matches every Apollo record; only keep the strongest matches.
    return [aid for s, aid in sorted(scored, reverse=True) if s == best]


def classify(question: str, page: str | None = None, artifact_id: str | None = None) -> Intent:
    """Picks one or two topics for the question, in priority order (spec §3)."""
    words = set(_words(question))
    lowered = question.lower()
    reasons: dict[str, list[str]] = {}

    artifacts = named_artifacts(question)
    mission_hits = sorted(words & MISSION_WORDS)
    if artifacts or mission_hits:
        reasons["missions"] = artifacts + mission_hits
    solar = sorted(words & SOLAR_SYSTEM_WORDS)
    if solar:
        reasons["solar_system"] = solar
    deep = sorted(words & DEEP_SPACE_WORDS) + [p for p in DEEP_SPACE_PHRASES if p in lowered]
    if deep:
        reasons["deep_space"] = deep

    # A question naming a machine is about that machine; "Mars" in "Mars Pathfinder" is not a planet question.
    if artifacts and set(solar) <= {"mars", "moon", "lunar", "martian", "landing"}:
        reasons.pop("solar_system", None)

    # Order: the topic with the most evidence first; ties follow the spec's order.
    priority = {"missions": 0, "solar_system": 1, "deep_space": 2}
    topics: list[Topic] = sorted(reasons, key=lambda t: (-len(reasons[t]), priority[t]))[:MAX_TOPICS]  # type: ignore[assignment]

    if not topics and artifact_id:
        topics, reasons["missions"] = ["missions"], [f"page artifact {artifact_id}"]
    elif not topics and page and any(w in page for w in ("moon", "mars")):
        topics, reasons["solar_system"] = ["solar_system"], [f"page {page}"]
    if not topics:
        topics = ["general"]

    ids = artifacts or ([artifact_id] if artifact_id and "missions" in topics else [])
    return Intent(topics=topics, visual=bool(VISUAL.search(question)), reasons=reasons, artifact_ids=ids)
