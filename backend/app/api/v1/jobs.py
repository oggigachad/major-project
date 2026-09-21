"""Job endpoints: list, create and the AI semantic screening (Qdrant)."""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse as Resp

from app.api.deps import db_from, get_payload, redis_from
from app.api.v1.ws import broadcast_ws_event
from app.core.config import get_settings
from app.core.guards import ApiError, origin_allowed
from app.schemas.requests import JobCreateIn
from app.serializers import serialize_job
from app.services import auth_service, screen_service
from app.services.stats_service import get_stats, invalidate_stats_cache


settings = get_settings()
router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
async def list_jobs(request: Request, claims: Dict[str, Any] = Depends(get_payload)):
    db = db_from(request)
    rows = [d async for d in db.jobs.find({}).sort([("created_at", -1)])]
    return {"jobs": [serialize_job(r) for r in rows], "total": len(rows)}


@router.post("", status_code=201)
async def create_job(body: JobCreateIn, request: Request,
                     claims: Dict[str, Any] = Depends(get_payload)):
    if not origin_allowed(request):
        raise ApiError(403, "Cross-origin request rejected")

    db = db_from(request)
    redis = redis_from(request)
    now = datetime.now(timezone.utc)

    doc = {
        "slug": f"j-{uuid.uuid4().hex[:8]}",
        "title": body.title,
        "dept": body.dept,
        "location": body.location,
        "employment_type": body.type,
        "status": "OPEN",
        "posted_days_ago": 0,
        "pipeline": [0, 0, 0, 0, 0],
        "created_by_id": claims["sub"],
        "created_at": now,
        "updated_at": now,
    }
    await db.jobs.insert_one(doc)
    await auth_service.log_activity(
        db, claims["sub"], "job_created", f"{doc['title']} ({doc['dept']})"
    )
    await invalidate_stats_cache(redis)

    ser_job = serialize_job(doc)
    fresh_stats = await get_stats(db, redis, force=True)

    await broadcast_ws_event("job:created", ser_job)
    await broadcast_ws_event("stats:updated", fresh_stats)
    await broadcast_ws_event(
        "notification:new",
        {
            "id": f"notif-{uuid.uuid4().hex[:6]}",
            "title": "New Job Published",
            "message": f"{doc['title']} ({doc['dept']}) opened for applications",
            "time": "just now",
            "tone": "olive",
        },
    )
    return {"job": ser_job}


@router.post("/{slug}/screen")
async def screen_job(slug: str, request: Request,
                     claims: Dict[str, Any] = Depends(get_payload)):
    """AI semantic screening — ranks candidates for this job using Evalix pipeline.

    Maintains backwards compatibility with frontend `results` array while also
    providing structured candidate ranking.
    """
    db = db_from(request)
    job = await db.jobs.find_one({"slug": slug})
    if not job:
        raise ApiError(404, "Job not found")

    qdrant = getattr(request.app.state, "qdrant", None)
    results = await screen_service.screen_job(db, qdrant, job, limit=10)

    await broadcast_ws_event(
        "notification:new",
        {
            "id": f"notif-{uuid.uuid4().hex[:6]}",
            "title": "AI Screening Completed",
            "message": f"Semantic ranking generated for {job['title']}",
            "time": "just now",
            "tone": "olive",
        },
    )
    return results


@router.get("/{slug}/screen")
async def get_screened_job(slug: str, request: Request,
                          claims: Dict[str, Any] = Depends(get_payload)):
    """Step 6 Candidate ranking for a specific job."""
    db = db_from(request)
    job = await db.jobs.find_one({"slug": slug})
    if not job:
        raise ApiError(404, "Job not found")

    qdrant = getattr(request.app.state, "qdrant", None)
    results = await screen_service.screen_job(db, qdrant, job, limit=20)
    return {
        "job_id": slug,
        "candidates": results.get("candidates", []),
    }

