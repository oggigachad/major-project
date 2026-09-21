"""Settings API endpoints for EvalixAI recruitment intelligence.

Manages recruiter organization configurations, AI screening sensitivity thresholds,
auto-shortlisting rules, interview proctoring preferences, and notification defaults.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from app.api.deps import db_from, get_payload

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULT_SETTINGS = {
    "organization_name": "Evalix Intelligence Corp",
    "screening_threshold": 75,
    "auto_shortlist": True,
    "anonymize_resumes": True,
    "interview_depth": "deep",
    "interview_voice": "alloy",
    "proctoring_strictness": "standard",
    "notifications_email": True,
    "notifications_slack": False,
    "theme_mode": "system",
}


class SettingsUpdateSchema(BaseModel):
    organization_name: Optional[str] = Field(None, max_length=100)
    screening_threshold: Optional[int] = Field(None, ge=10, le=100)
    auto_shortlist: Optional[bool] = None
    anonymize_resumes: Optional[bool] = None
    interview_depth: Optional[str] = Field(None, pattern="^(standard|deep|comprehensive)$")
    interview_voice: Optional[str] = Field(None, pattern="^(alloy|echo|fable|onyx|nova|shimmer)$")
    proctoring_strictness: Optional[str] = Field(None, pattern="^(relaxed|standard|strict)$")
    notifications_email: Optional[bool] = None
    notifications_slack: Optional[bool] = None
    theme_mode: Optional[str] = Field(None, pattern="^(light|dark|system)$")


@router.get("")
async def get_settings(
    request: Request,
    claims: Dict[str, Any] = Depends(get_payload),
):
    """Retrieve recruiter/workspace system settings."""
    db: AsyncIOMotorDatabase = db_from(request)
    user_id = claims.get("sub") or "global"

    doc = await db.settings.find_one({"user_id": user_id})
    if not doc:
        # Fall back to default
        doc = await db.settings.find_one({"user_id": "global"})

    merged = dict(DEFAULT_SETTINGS)
    if doc:
        for k, v in doc.items():
            if k not in ("_id", "user_id"):
                merged[k] = v

    return {"status": "ok", "settings": merged}


@router.patch("")
async def update_settings(
    payload: SettingsUpdateSchema,
    request: Request,
    claims: Dict[str, Any] = Depends(get_payload),
):
    """Update workspace system settings."""
    db: AsyncIOMotorDatabase = db_from(request)
    user_id = claims.get("sub") or "global"

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        return {"status": "ok", "message": "No changes provided"}

    await db.settings.update_one(
        {"user_id": user_id},
        {"$set": updates},
        upsert=True,
    )

    # Fetch updated
    doc = await db.settings.find_one({"user_id": user_id})
    merged = dict(DEFAULT_SETTINGS)
    if doc:
        for k, v in doc.items():
            if k not in ("_id", "user_id"):
                merged[k] = v

    return {"status": "ok", "settings": merged}
