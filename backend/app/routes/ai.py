from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.config import get_settings
from app.models import AstroReply, ChatRequest, ExplainRequest, PageContext, SuggestedQuestions
from app.rate_limit import rate_limit
from app.services.ai_service import AstroService
from app.services.knowledge_service import get_knowledge_base

router = APIRouter(prefix="/api/ai", tags=["Astro AI"])


def get_astro() -> AstroService:
    return AstroService(get_settings(), get_knowledge_base())


@router.post("/chat", response_model=AstroReply, dependencies=[Depends(rate_limit)])
async def chat(req: ChatRequest, astro: AstroService = Depends(get_astro)) -> AstroReply:
    """Answer a child's question, grounded in the museum's verified mission data."""
    return await astro.chat(req.message, req.history, req.context)


@router.post("/explain", response_model=AstroReply, dependencies=[Depends(rate_limit)])
async def explain(req: ExplainRequest, astro: AstroService = Depends(get_astro)) -> AstroReply:
    """Explain a single space word or technical term in child-friendly language."""
    return await astro.explain(req.term, req.context)


@router.get("/suggested-questions", response_model=SuggestedQuestions)
def suggested_questions(
    page: str | None = Query(default=None, max_length=50),
    artifact_id: str | None = Query(default=None, max_length=60),
    astro: AstroService = Depends(get_astro),
) -> SuggestedQuestions:
    """Starter questions that fit the page or artifact the child is looking at."""
    ctx = PageContext(page=page, artifactId=artifact_id)
    return SuggestedQuestions(questions=astro.suggested_questions(ctx.page, ctx.artifactId))
