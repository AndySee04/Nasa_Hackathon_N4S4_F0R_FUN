"""Builds the Cosmic AI knowledge base (SQLite + FTS5) from curated, NASA-sourced files.

Inputs (all in Git, all reviewed by people):
  app/kb/sources.json               allow-list of sources: every URL an answer may cite
  app/kb/planetary_factsheet.json   NASA NSSDCA Planetary Fact Sheet numbers
  app/kb/docs/*.md                  short explainers with front-matter
  app/data/artifacts.json           mission records (shared with the website and game)
  app/data/glossary.json            kid-friendly word list

The build refuses to run if a document cites an unknown source, a source is not on
an allowed NASA domain, or text looks like instructions aimed at the AI. AI answers
are never written back into the knowledge base.

Usage:  python -m app.kb.build [output.db]     (default: app/data/knowledge.db)
"""

from __future__ import annotations

import json
import re
import sqlite3
import sys
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

KB_DIR = Path(__file__).resolve().parent
DATA_DIR = KB_DIR.parent / "data"
DEFAULT_DB = DATA_DIR / "knowledge.db"

ALLOWED_HOST_SUFFIXES = (".nasa.gov",)
TOPICS = {"solar_system", "missions", "deep_space", "general"}
CATEGORIES = {
    "sun", "planet", "moon", "dwarf_planet", "mission", "nebula", "black_hole",
    "exoplanet", "constellation", "galaxy", "asteroid", "glossary",
}  # fmt: skip
REQUIRED_META = ("id", "title", "category", "topic", "source_ids", "last_verified")
# Big enough to keep a short explainer (and its "because…") in one piece.
CHUNK_WORDS = 200

# Text in the knowledge base must read as facts, never as orders to the model.
INSTRUCTION_PATTERNS = re.compile(
    r"ignore (all |any )?(previous|prior|above)|system prompt|you are now|disregard .{0,20}instructions|<\s*/?\s*(system|facts)\s*>",
    re.IGNORECASE,
)

SCHEMA = """
CREATE TABLE sources (id TEXT PRIMARY KEY, title TEXT NOT NULL, url TEXT NOT NULL UNIQUE, publisher TEXT, last_verified TEXT);
CREATE TABLE documents (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL, category TEXT NOT NULL, topic TEXT NOT NULL,
  aliases TEXT NOT NULL, source_ids TEXT NOT NULL, last_verified TEXT, body TEXT NOT NULL
);
CREATE TABLE records (id TEXT PRIMARY KEY, world TEXT, status TEXT, last_verified TEXT, json TEXT NOT NULL);
CREATE VIRTUAL TABLE chunks USING fts5(
  doc_id UNINDEXED, topic UNINDEXED, category UNINDEXED, title, aliases, body,
  tokenize = 'porter unicode61'
);
CREATE TABLE cache (key TEXT PRIMARY KEY, answer TEXT NOT NULL, created_at REAL NOT NULL, expires_at REAL NOT NULL);
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
"""


class KnowledgeBuildError(ValueError):
    """The curated files break a knowledge-base rule. The message says which file and why."""


@dataclass
class Document:
    id: str
    kind: str  # "doc", "factsheet", "artifact" or "glossary"
    title: str
    category: str
    topic: str
    body: str
    source_ids: list[str] = field(default_factory=list)
    aliases: list[str] = field(default_factory=list)
    last_verified: str | None = None


# ---------- parsing ----------
def parse_front_matter(text: str, name: str) -> tuple[dict, str]:
    """Reads a small YAML-like header: `key: value` and `key: [a, b]` lines only (no dependency)."""
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.DOTALL)
    if not m:
        raise KnowledgeBuildError(f"{name}: missing front-matter block")
    meta: dict = {}
    for line in m.group(1).splitlines():
        if not line.strip():
            continue
        key, sep, value = line.partition(":")
        if not sep:
            raise KnowledgeBuildError(f"{name}: bad front-matter line {line!r}")
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            meta[key.strip()] = [v.strip() for v in value[1:-1].split(",") if v.strip()]
        else:
            meta[key.strip()] = value
    return meta, m.group(2).strip()


def _check_date(value: str | None, where: str) -> None:
    try:
        date.fromisoformat(str(value))
    except ValueError as e:
        raise KnowledgeBuildError(f"{where}: last_verified must be YYYY-MM-DD, got {value!r}") from e


def _check_text(text: str, where: str) -> None:
    if INSTRUCTION_PATTERNS.search(text):
        raise KnowledgeBuildError(f"{where}: text looks like instructions to the AI; knowledge must be plain facts")


def check_url(url: str, where: str) -> None:
    host = urlparse(url).hostname or ""
    if not url.startswith("https://") or not (host == "nasa.gov" or host.endswith(ALLOWED_HOST_SUFFIXES)):
        raise KnowledgeBuildError(f"{where}: source URL must be https on a NASA domain, got {url!r}")


def load_sources(kb_dir: Path = KB_DIR) -> dict[str, dict]:
    sources: dict[str, dict] = {}
    for s in json.loads((kb_dir / "sources.json").read_text(encoding="utf-8")):
        where = f"sources.json[{s.get('id')}]"
        if s["id"] in sources:
            raise KnowledgeBuildError(f"{where}: duplicate id")
        check_url(s["url"], where)
        _check_date(s.get("last_verified"), where)
        sources[s["id"]] = s
    return sources


def load_docs(kb_dir: Path, sources: dict[str, dict]) -> list[Document]:
    docs = []
    for path in sorted((kb_dir / "docs").glob("*.md")):
        meta, body = parse_front_matter(path.read_text(encoding="utf-8"), path.name)
        missing = [k for k in REQUIRED_META if not meta.get(k)]
        if missing:
            raise KnowledgeBuildError(f"{path.name}: missing {', '.join(missing)}")
        if meta["id"] != path.stem:
            raise KnowledgeBuildError(f"{path.name}: id {meta['id']!r} must match the file name")
        if meta["topic"] not in TOPICS or meta["category"] not in CATEGORIES:
            raise KnowledgeBuildError(f"{path.name}: unknown topic or category")
        unknown = [s for s in meta["source_ids"] if s not in sources]
        if unknown:
            raise KnowledgeBuildError(f"{path.name}: unknown source ids {unknown}; add them to sources.json first")
        _check_date(meta["last_verified"], path.name)
        _check_text(body, path.name)
        docs.append(
            Document(
                id=meta["id"], kind="doc", title=meta["title"], category=meta["category"], topic=meta["topic"],
                body=body, source_ids=list(meta["source_ids"]), aliases=list(meta.get("aliases", [])),
                last_verified=meta["last_verified"],
            )
        )  # fmt: skip
    return docs


def _num(v: float) -> str:
    return f"{v:,.0f}" if abs(v) >= 100 else f"{v:g}"


def factsheet_docs(kb_dir: Path, sources: dict[str, dict]) -> list[Document]:
    """Turns NASA's Planetary Fact Sheet into one short, number-exact entry per body."""
    sheet = json.loads((kb_dir / "planetary_factsheet.json").read_text(encoding="utf-8"))
    if sheet["source_id"] not in sources:
        raise KnowledgeBuildError("planetary_factsheet.json: unknown source_id")
    _check_date(sheet["last_verified"], "planetary_factsheet.json")
    docs = []
    for key, b in sheet["bodies"].items():
        name = b["name"]
        title = name[0].upper() + name[1:]
        lines = []
        if b["order"]:
            lines.append(f"{title} is planet number {b['order']} from the Sun.")
        elif key == "pluto":
            lines.append("Pluto is a dwarf planet far beyond Neptune.")
        lines.append(f"{title} is about {_num(b['diameter_km'])} km across. Earth is about 12,756 km across.")
        if key == "moon":
            lines.append(f"It is about {_num(b['distance_from_sun_1e6_km'] * 1000)} thousand km from Earth on average.")
            lines.append(f"It takes about {b['orbital_period_days']} days to orbit Earth.")
        else:
            lines.append(f"On average it is about {_num(b['distance_from_sun_1e6_km'])} million km from the Sun.")
            years = b["orbital_period_days"] / 365.2
            year_text = (
                f"{b['orbital_period_days']:g} Earth days"
                if years < 2
                else f"{_num(b['orbital_period_days'])} Earth days (about {years:.0f} Earth years)"
            )
            lines.append(f"One trip around the Sun (its year) takes {year_text}.")
        day = b["length_of_day_hours"]
        lines.append(
            f"One day, from noon to noon, lasts about {_num(day)} hours"
            + (f" (about {day / 24:.0f} Earth days)." if day > 48 else ".")
        )
        lines.append(f"Gravity at the surface is {b['gravity_m_s2']} m/s². On Earth it is 9.8 m/s².")
        lines.append(f"The average temperature is about {b['mean_temperature_c']} °C.")
        moons = b["moons"]
        lines.append("It has no moons." if moons == 0 else f"It has {moons} known moon{'s' if moons != 1 else ''}.")
        lines.append("It has rings." if b["rings"] else "It has no rings.")
        field_text = {
            "yes": "It has a global magnetic field.",
            "no": "It has no global magnetic field.",
            "unknown": "Scientists don't yet know if it has a global magnetic field.",
        }
        lines.append(field_text[b["magnetic_field"]])
        category = "moon" if key == "moon" else "dwarf_planet" if key == "pluto" else "planet"
        docs.append(
            Document(
                id=f"factsheet-{key}", kind="factsheet", title=f"{title}: NASA fact sheet numbers", category=category,
                topic="solar_system", body=" ".join(lines), source_ids=[sheet["source_id"]], aliases=[title, key],
                last_verified=sheet["last_verified"],
            )
        )  # fmt: skip
    return docs


def artifact_docs(data_dir: Path, sources: dict[str, dict]) -> tuple[list[Document], list[dict]]:
    """Mission records become documents; their source URLs join the allow-list automatically."""
    from app.services.knowledge_service import KnowledgeBase

    artifacts = json.loads((data_dir / "artifacts.json").read_text(encoding="utf-8"))
    by_url = {s["url"]: sid for sid, s in sources.items()}
    docs = []
    for a in artifacts:
        ids = []
        for s in a["sources"]:
            check_url(s["url"], f"artifacts.json[{a['id']}]")
            if s["url"] not in by_url:
                sid = "artifact-src-" + re.sub(r"[^a-z0-9]+", "-", s["url"].split("//", 1)[1].lower()).strip("-")[:80]
                sources[sid] = {
                    "id": sid,
                    "title": s["title"],
                    "url": s["url"],
                    "publisher": "NASA",
                    "last_verified": a.get("lastVerified"),
                }
                by_url[s["url"]] = sid
            ids.append(by_url[s["url"]])
        text = KnowledgeBase._artifact_doc(a).text
        _check_text(text, f"artifacts.json[{a['id']}]")
        docs.append(
            Document(
                id=a["id"], kind="artifact", title=a["name"], category="mission", topic="missions", body=text,
                source_ids=ids, aliases=[a["missionName"], a["name"], a["id"].replace("-", " ")],
                last_verified=a.get("lastVerified"),
            )
        )  # fmt: skip
    return docs, artifacts


def glossary_docs(data_dir: Path) -> list[Document]:
    """Glossary entries are simple explanations without a source, so answers built on them are 'general_knowledge'."""
    docs = []
    for g in json.loads((data_dir / "glossary.json").read_text(encoding="utf-8")):
        body = f"{g['term']}: {g['definition']} {g['analogy']}"
        _check_text(body, f"glossary.json[{g['term']}]")
        docs.append(
            Document(
                id="glossary-" + re.sub(r"[^a-z0-9]+", "-", g["term"].lower()).strip("-"), kind="glossary",
                title=g["term"], category="glossary", topic="general", body=body, aliases=[g["term"], *g.get("aliases", [])],
            )
        )  # fmt: skip
    return docs


def chunk(text: str, words: int = CHUNK_WORDS) -> list[str]:
    """Splits on paragraphs, then packs paragraphs into chunks of about `words` words."""
    out: list[str] = []
    current: list[str] = []
    for para in [p.strip() for p in re.split(r"\n\s*\n|\n", text) if p.strip()]:
        if current and len(" ".join(current).split()) + len(para.split()) > words:
            out.append(" ".join(current))
            current = []
        current.append(para)
    if current:
        out.append(" ".join(current))
    return out


# ---------- build ----------
def collect(kb_dir: Path = KB_DIR, data_dir: Path = DATA_DIR) -> tuple[dict[str, dict], list[Document], list[dict]]:
    sources = load_sources(kb_dir)
    docs = load_docs(kb_dir, sources) + factsheet_docs(kb_dir, sources)
    mission_docs, artifacts = artifact_docs(data_dir, sources)
    docs += mission_docs + glossary_docs(data_dir)
    ids = [d.id for d in docs]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        raise KnowledgeBuildError(f"duplicate document ids: {sorted(dupes)}")
    return sources, docs, artifacts


def build_database(target: str | Path = ":memory:", kb_dir: Path = KB_DIR, data_dir: Path = DATA_DIR) -> sqlite3.Connection:
    """Builds a fresh database and returns an open connection. Use ':memory:' at runtime and in tests."""
    sources, docs, artifacts = collect(kb_dir, data_dir)
    if target != ":memory:":
        Path(target).unlink(missing_ok=True)
    conn = sqlite3.connect(str(target), check_same_thread=False)
    conn.executescript(SCHEMA)
    conn.executemany(
        "INSERT INTO sources VALUES (?, ?, ?, ?, ?)",
        [(s["id"], s["title"], s["url"], s.get("publisher"), s.get("last_verified")) for s in sources.values()],
    )
    for d in docs:
        conn.execute(
            "INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                d.id,
                d.kind,
                d.title,
                d.category,
                d.topic,
                json.dumps(d.aliases),
                json.dumps(d.source_ids),
                d.last_verified,
                d.body,
            ),
        )
        for piece in chunk(d.body):
            conn.execute(
                "INSERT INTO chunks (doc_id, topic, category, title, aliases, body) VALUES (?, ?, ?, ?, ?, ?)",
                (d.id, d.topic, d.category, d.title, " ".join(d.aliases), piece),
            )
    conn.executemany(
        "INSERT INTO records VALUES (?, ?, ?, ?, ?)",
        [(a["id"], a["world"], a["status"], a.get("lastVerified"), json.dumps(a, ensure_ascii=False)) for a in artifacts],
    )
    conn.executemany("INSERT INTO meta VALUES (?, ?)", [("built", date.today().isoformat()), ("documents", str(len(docs)))])
    conn.commit()
    return conn


def main(argv: list[str]) -> int:
    target = Path(argv[1]) if len(argv) > 1 else DEFAULT_DB
    try:
        conn = build_database(target)
    except KnowledgeBuildError as e:
        print(f"Knowledge base NOT built: {e}", file=sys.stderr)
        return 1
    counts = {t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in ("sources", "documents", "chunks", "records")}  # noqa: S608
    print(f"Built {target}: " + ", ".join(f"{n} {t}" for t, n in counts.items()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
