"""N4S4 F0R FUN backend: REST API for Astro AI and the artifact records.

Run locally:  uvicorn app.main:app --reload --port 8000
API docs:     http://localhost:8000/docs
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.models import Health
from app.routes import ai, artifacts
from app.services.knowledge_service import get_knowledge_base

logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(
    title="N4S4 F0R FUN API",
    description="Astro AI, a child-friendly space guide, plus verified spacecraft records.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(ai.router)
app.include_router(artifacts.router)


@app.get("/api/health", response_model=Health, tags=["System"])
def health() -> Health:
    """Lets the frontend show whether Astro is online and which mode it runs in."""
    return Health(status="ok", ai_mode=get_settings().ai_mode, artifacts_loaded=len(get_knowledge_base().artifacts))
