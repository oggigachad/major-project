"""AI Proctoring Engine for online candidate assessment verification.

Architecture derived from AI-Proctored-Assessment-Platform:
- Focus integrity tracking (tab-switches, browser blur)
- Vision proctoring telemetry (face presence, multiple faces)
- Cumulative integrity risk scoring (0-100)
- Evidence capture & persistence to MinIO S3 object storage
"""

import base64
from datetime import datetime, timezone
import logging
import uuid
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from minio import Minio

from app.db.minio import EVIDENCE_BUCKET, upload_bytes

log = logging.getLogger("evalix.proctoring")

VIOLATION_WEIGHTS = {
    "tab_switch": 15,
    "window_blur": 5,
    "face_missing": 12,
    "multiple_faces": 30,
    "audio_spike": 10,
    "devtools_open": 35,
}


def calculate_risk_score(violations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate overall risk score and rating from recorded violations."""
    total_penalty = 0
    event_counts: Dict[str, int] = {}

    for v in violations:
        v_type = v.get("type", "")
        penalty = VIOLATION_WEIGHTS.get(v_type, 5)
        total_penalty += penalty
        event_counts[v_type] = event_counts.get(v_type, 0) + 1

    # Cap score between 0 and 100
    risk_score = min(100, max(0, total_penalty))
    risk_level = "LOW"
    if risk_score >= 50:
        risk_level = "HIGH"
    elif risk_score >= 25:
        risk_level = "MEDIUM"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "total_violations": len(violations),
        "breakdown": event_counts,
    }


async def log_proctor_violation(
    db: AsyncIOMotorDatabase,
    assessment_id: str,
    violation_type: str,
    detail: str,
    snapshot_base64: Optional[str] = None,
    minio_client: Optional[Minio] = None,
) -> Dict[str, Any]:
    """Record proctoring violation and upload snapshot to MinIO if present."""
    now = datetime.now(timezone.utc)
    evidence_url: Optional[str] = None

    # Handle image upload to MinIO
    if snapshot_base64 and minio_client:
        try:
            # Strip data URI header if present
            if "," in snapshot_base64:
                _, b64_data = snapshot_base64.split(",", 1)
            else:
                b64_data = snapshot_base64

            image_bytes = base64.b64decode(b64_data)
            object_name = f"evidence/{assessment_id}/{uuid.uuid4().hex[:12]}.jpg"
            upload_bytes(minio_client, EVIDENCE_BUCKET, object_name, image_bytes, content_type="image/jpeg")
            evidence_url = f"/api/v1/assessments/{assessment_id}/evidence/{object_name}"
            log.info("Uploaded proctoring evidence %s to MinIO", object_name)
        except Exception as e:
            log.warning("Failed to upload proctoring snapshot to MinIO: %s", e)

    violation_record = {
        "id": f"viol-{uuid.uuid4().hex[:8]}",
        "type": violation_type,
        "detail": detail,
        "evidence_url": evidence_url,
        "timestamp": now.isoformat(),
    }

    # Append to assessment session in MongoDB
    session = await db.assessments.find_one({"assessment_id": assessment_id})
    if session:
        violations = session.get("proctoring_violations", [])
        violations.append(violation_record)
        risk_summary = calculate_risk_score(violations)

        await db.assessments.update_one(
            {"assessment_id": assessment_id},
            {
                "$set": {
                    "proctoring_violations": violations,
                    "proctoring_risk": risk_summary,
                    "updated_at": now,
                }
            },
        )
        return {"violation": violation_record, "risk": risk_summary}

    return {"violation": violation_record, "risk": {"risk_score": 0, "risk_level": "LOW"}}
