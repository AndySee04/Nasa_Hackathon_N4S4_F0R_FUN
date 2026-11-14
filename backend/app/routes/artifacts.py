from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.services.knowledge_service import get_knowledge_base

router = APIRouter(prefix="/api/artifacts", tags=["Artifacts"])


@router.get("")
def list_artifacts(world: str | None = Query(default=None, pattern="^(moon|mars|deep-space)$")) -> list[dict]:
    """All artifact records, optionally filtered by world."""
    items = get_knowledge_base().artifacts
    return [a for a in items if world is None or a["world"] == world]


@router.get("/{artifact_id}")
def get_artifact(artifact_id: str) -> dict:
    artifact = get_knowledge_base().artifact(artifact_id)
    if artifact is None:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return artifact
