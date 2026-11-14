"""Request and response schemas for the REST API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

MAX_MESSAGE_LENGTH = 500


class Source(BaseModel):
    title: str
    url: str


class PageContext(BaseModel):
    page: str | None = Field(default=None, max_length=50)
    artifactId: str | None = Field(default=None, max_length=60)


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
    mode: Literal["llm", "knowledge"]
    safety_note: str | None = None


class SuggestedQuestions(BaseModel):
    questions: list[str]


class Health(BaseModel):
    status: Literal["ok"]
    ai_mode: Literal["llm", "knowledge"]
    artifacts_loaded: int
