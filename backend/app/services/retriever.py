"""Retrieval over the Cosmic AI knowledge base (SQLite FTS5, BM25 ranking).

Callers only see `Retriever.search()`. Embeddings can be added later behind the same
method without changing the agents that use it (docs/specs/ai-cosmic-tutor.md §2).
"""

from __future__ import annotations

import json
import sqlite3
import threading
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Literal

from app.services.knowledge_service import tokenize

Confidence = Literal["sourced", "general_knowledge", "unsure"]

# BM25 weights for the FTS columns (doc_id, topic, category, title, aliases, body).
# Names in titles and aliases matter far more than a word somewhere in the body.
BM25_WEIGHTS = (0.0, 0.0, 0.0, 6.0, 8.0, 1.0)
MAX_QUERY_TERMS = 12
# Common words like "moon" score low in BM25 because they appear everywhere, so a question
# word that names a document (its title or an alias) adds this bonus on top.
NAME_BONUS = 3.0
NAME_NOISE = {"nasa", "fact", "sheet", "numbers", "stage", "module", "descent", "lunar", "planet", "planets", "system"}


@dataclass(frozen=True)
class Source:
    id: str
    title: str
    url: str


@dataclass
class Hit:
    doc_id: str
    kind: str
    title: str
    topic: str
    category: str
    text: str
    score: float  # higher is better
    last_verified: str | None
    sources: list[Source] = field(default_factory=list)
    #: How many question words name this document (its title or an alias). Strong evidence it is on topic.
    name_matches: int = 0

    @property
    def confidence(self) -> Confidence:
        return "sourced" if self.sources else "general_knowledge"


def fts_query(question: str) -> str | None:
    """Turns free text into a safe FTS5 query: quoted terms joined with OR (no FTS syntax from users)."""
    terms = list(dict.fromkeys(tokenize(question)))[:MAX_QUERY_TERMS]
    return " OR ".join(f'"{t}"' for t in terms) if terms else None


class Retriever:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn
        self._lock = threading.Lock()
        self._sources = {r[0]: Source(*r) for r in conn.execute("SELECT id, title, url FROM sources")}
        # Glossary entries keep every word of their term ("descent stage"); other names drop generic words.
        self._names = {
            doc_id: set(tokenize(title + " " + " ".join(json.loads(aliases)))) - (set() if kind == "glossary" else NAME_NOISE)
            for doc_id, kind, title, aliases in conn.execute("SELECT id, kind, title, aliases FROM documents")
        }

    def search(
        self,
        question: str,
        *,
        topics: set[str] | None = None,
        categories: set[str] | None = None,
        k: int = 4,
    ) -> list[Hit]:
        """Best chunks for the question, at most one per document, optionally limited to topics/categories."""
        query = fts_query(question)
        if not query:
            return []
        sql = (
            "SELECT c.doc_id, d.kind, d.title, d.topic, d.category, c.body, bm25(chunks, ?, ?, ?, ?, ?, ?) AS rank, "
            "d.last_verified, d.source_ids FROM chunks c JOIN documents d ON d.id = c.doc_id WHERE chunks MATCH ?"
        )
        params: list = [*BM25_WEIGHTS, query]
        if topics:
            sql += f" AND d.topic IN ({','.join('?' * len(topics))})"
            params += sorted(topics)
        if categories:
            sql += f" AND d.category IN ({','.join('?' * len(categories))})"
            params += sorted(categories)
        sql += " ORDER BY rank LIMIT ?"
        params.append(k * 8)
        with self._lock:
            rows = self.conn.execute(sql, params).fetchall()
        q_terms = set(tokenize(question))
        best: dict[str, Hit] = {}
        for doc_id, kind, title, topic, category, body, rank, verified, source_ids in rows:
            names = len(q_terms & self._names.get(doc_id, set()))
            score = -rank + NAME_BONUS * names
            if doc_id in best and best[doc_id].score >= score:
                continue
            sources = [self._sources[s] for s in json.loads(source_ids) if s in self._sources]
            best[doc_id] = Hit(doc_id, kind, title, topic, category, body, score, verified, sources, names)
        return sorted(best.values(), key=lambda h: h.score, reverse=True)[:k]

    def document_hit(self, doc_id: str) -> Hit | None:
        """The first chunk of one document, e.g. the artifact page the child is looking at."""
        with self._lock:
            row = self.conn.execute(
                "SELECT c.doc_id, d.kind, d.title, d.topic, d.category, c.body, d.last_verified, d.source_ids "
                "FROM chunks c JOIN documents d ON d.id = c.doc_id WHERE c.doc_id = ? LIMIT 1",
                (doc_id,),
            ).fetchone()
        if not row:
            return None
        doc_id, kind, title, topic, category, body, verified, source_ids = row
        sources = [self._sources[s] for s in json.loads(source_ids) if s in self._sources]
        return Hit(doc_id, kind, title, topic, category, body, 0.0, verified, sources, name_matches=1)

    def is_allowed_url(self, url: str) -> bool:
        """Only URLs in the source registry may appear in an answer."""
        return any(s.url == url for s in self._sources.values())

    def document_count(self) -> int:
        with self._lock:
            return self.conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]


@lru_cache(maxsize=1)
def get_retriever() -> Retriever:
    """Builds the knowledge base in memory on first use (well under a second for this corpus)."""
    from app.kb.build import build_database

    return Retriever(build_database(":memory:"))
