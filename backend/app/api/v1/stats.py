import uuid
from typing import Any, Dict

from fastapi import APIRouter, Depends, Request

from app.api.deps import db_from, get_payload, redis_from
from app.api.v1.ws import broadcast_ws_event
from app.services.stats_service import generate_dynamic_insight, get_stats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
async def stats(request: Request, claims: Dict[str, Any] = Depends(get_payload)):
    db = db_from(request)
    redis = redis_from(request)
    return await get_stats(db, redis)


@router.post("/insights/generate")
async def generate_insight(
    request: Request, claims: Dict[str, Any] = Depends(get_payload)
):
    db = db_from(request)
    redis = redis_from(request)
    insight = await generate_dynamic_insight(db, redis)
    fresh_stats = await get_stats(db, redis, force=True)

    await broadcast_ws_event("stats:updated", fresh_stats)
    await broadcast_ws_event(
        "notification:new",
        {
            "id": f"notif-{uuid.uuid4().hex[:6]}",
            "title": "AI Pipeline Insight",
            "message": insight.get("text", "New hiring trend detected."),
            "time": "just now",
            "tone": insight.get("tone", "olive"),
        },
    )
    return {"insight": insight, "stats": fresh_stats}

