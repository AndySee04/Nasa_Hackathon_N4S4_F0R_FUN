"""Request and response schemas for the REST API."""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field

MAX_MESSAGE_LENGTH = 500


class Source(BaseModel):
    title: str
    url: str


class PageContext(BaseModel):
    page: str | None = Field(default=None, max_length=50)
    artifactId: str | None = Field(default=None, max_length=60)
    #: Game context (docs/specs/contract-game-ai.md). All optional, so older clients keep working.
    campaign: Literal["moon"] | None = None
    stage: Literal["landing", "catch", "discovery", "repair", "science", "quiz", "complete"] | None = None
    #: Questions the child already asked, so suggestions don't repeat them.
    askedQuestions: list[Annotated[str, Field(max_length=200)]] = Field(default_factory=list, max_length=10)


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=MAX_MESSAGE_LENGTH)
    history: list[ChatTurn] = Field(default_factory=list, max_length=12)
    context: PageContext = Field(default_factory=PageContext)


class ExplainRequest(BaseModel):
    term: str = Field(min_length=1, max_length=80)
    context: PageContext = Field(default_factory=PageContext)


class AstroReply(BaseModel):
    reply: str
    sources: list[Source] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    #: "cache" means the same question was answered recently and nothing new was computed.
    mode: Literal["llm", "knowledge", "cache"]
    safety_note: str | None = None
    #: Which part of the knowledge base answered (contract-game-ai.md §4). "blocked" when safety refused.
    topic: Literal["solar_system", "missions", "deep_space", "general", "blocked"] | None = None
    #: "sourced": from NASA-sourced facts; "general_knowledge": from the glossary; "unsure": no reliable facts.
    confidence: Literal["sourced", "general_knowledge", "unsure"] | None = None


class SuggestedQuestions(BaseModel):
    questions: list[str]


class Health(BaseModel):
    status: Literal["ok"]
    ai_mode: Literal["llm", "knowledge"]
    artifacts_loaded: int
