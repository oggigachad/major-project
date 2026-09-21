"""Presigned resume uploads (MinIO) — browsers upload directly to object
storage; the API only mints short-lived, single-object PUT URLs."""

from typing import Any, Dict
import uuid

from fastapi import APIRouter, Depends, Request

from app.api.deps import get_payload
from app.core.config import get_settings
from app.core.guards import ApiError
from app.db.minio import presign_upload, sanitize_name
from app.schemas.requests import PresignIn

settings = get_settings()
router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/presign")
async def presign(body: PresignIn, request: Request,
                  claims: Dict[str, Any] = Depends(get_payload)):
    minio = getattr(request.app.state, "minio", None)
    if minio is None:
        raise ApiError(
            503,
            "Object storage is disabled on this server "
            "(ENABLE_OBJECT_STORAGE=false or credentials missing).",
        )

    object_key = f"resumes/{claims['sub']}/{uuid.uuid4().hex[:8]}-{sanitize_name(body.filename)}"
    try:
        url = presign_upload(minio, object_key)
    except Exception as exc:
        raise ApiError(503, f"Could not issue an upload URL: {exc}")

    return {
        "uploadUrl": url,
        "objectKey": object_key,
        "method": "PUT",
        "headers": {"Content-Type": body.content_type},
        "expiresIn": settings.presign_expire_seconds,
    }
