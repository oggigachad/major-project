"""Infrastructure health probe (public — no auth)."""

import time
from typing import Any, Dict

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse as Resp

from app.core.config import get_settings

settings = get_settings()
router = APIRouter(tags=["health"])


@router.get("/health")
async def health(request: Request):
    started = time.monotonic()
    state = request.app.state

    db = getattr(state, "db", None)
    mongo_ok = False
    if db is not None:
        try:
            await db.command("ping")
            mongo_ok = True
        except Exception:
            mongo_ok = False

    redis = getattr(state, "redis", None)
    redis_ok = False
    if redis is not None:
        try:
            redis_ok = await redis.ping() is True
        except Exception:
            redis_ok = False

    qdrant_ok = False
    qdrant = getattr(state, "qdrant", None)
    if qdrant is not None:
        try:
            qdrant_ok = await qdrant.get_collections() is not None
        except Exception:
            qdrant_ok = False

    minio_ok = False
    minio = getattr(state, "minio", None)
    if minio is not None:
        try:
            minio_ok = minio.bucket_exists(settings.minio_bucket)
        except Exception:
            minio_ok = False

    checks = {
        "mongodb": "up" if mongo_ok else "down",
        "redis": "up" if redis_ok else "down",
        "qdrant": ("up" if qdrant_ok else "down")
        if settings.enable_vector_search
        else "disabled",
        "minio": ("up" if minio_ok else "down")
        if settings.enable_object_storage
        else "disabled",
    }

    body: Dict[str, Any] = {
        "status": "healthy" if mongo_ok and redis_ok else "degraded",
        "checks": checks,
        "latencyMs": int((time.monotonic() - started) * 1000),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    return Resp(body, status_code=200 if mongo_ok else 503)


@router.get("/health/live")
async def liveness():
    """Process-level liveness for container orchestrators."""
    return {"status": "alive"}
