"""Evalix AI Coding Assessment & Proctoring Endpoints.

Integrates Judge0 code execution, LeetCode-style challenge evaluation,
and AI Proctoring with MinIO evidence storage.
"""

from datetime import datetime, timezone
import io
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Request, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from app.api.deps import db_from
from app.api.v1.ws import broadcast_ws_event
from app.core.guards import ApiError
from app.db.minio import EVIDENCE_BUCKET
from app.services.evalix_code.executor import CHALLENGES, run_test_cases
from app.services.evalix_proctoring.proctor_engine import calculate_risk_score, log_proctor_violation

router = APIRouter(prefix="/assessments", tags=["assessments"])


class AssessmentInitIn(BaseModel):
    candidate_id: str
    challenge_id: Optional[str] = "two-sum"


class RunCodeIn(BaseModel):
    source_code: str = Field(min_length=1)
    language: str = Field(default="python")


class SubmitCodeIn(BaseModel):
    source_code: str = Field(min_length=1)
    language: str = Field(default="python")


class ProctorEventIn(BaseModel):
    type: str  # tab_switch, window_blur, face_missing, multiple_faces, audio_spike
    detail: str
    snapshot_base64: Optional[str] = None


@router.get("")
async def list_assessments(request: Request, status: str = "all"):
    """List all candidate coding assessments for the recruiter dashboard."""
    db: AsyncIOMotorDatabase = db_from(request)
    query = {}
    if status and status != "all":
        query["status"] = status.upper()

    docs = [doc async for doc in db.assessments.find(query).sort("created_at", -1)]
    for d in docs:
        d.pop("_id", None)
    return {"assessments": docs, "total": len(docs)}


@router.post("/init", status_code=201)
async def init_assessment(body: AssessmentInitIn, request: Request):
    """Initialize a proctored coding assessment session for a candidate."""
    db: AsyncIOMotorDatabase = db_from(request)
    candidate = await db.candidates.find_one({"slug": body.candidate_id})
    if not candidate:
        raise ApiError(404, "Candidate not found")

    challenge = CHALLENGES.get(body.challenge_id, CHALLENGES["two-sum"])
    assessment_id = f"asm-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)

    doc = {
        "assessment_id": assessment_id,
        "candidate_id": candidate["slug"],
        "candidate_name": candidate.get("name", "Candidate"),
        "role": candidate.get("role", "Software Engineer"),
        "challenge_id": challenge["id"],
        "challenge_title": challenge["title"],
        "difficulty": challenge["difficulty"],
        "status": "IN_PROGRESS",
        "language": "python",
        "submitted_code": challenge["starter_code"]["python"],
        "test_results": None,
        "pass_percentage": 0,
        "proctoring_violations": [],
        "proctoring_risk": {"risk_score": 0, "risk_level": "LOW", "total_violations": 0},
        "created_at": now.isoformat(),
        "submitted_at": None,
    }

    await db.assessments.insert_one(doc)
    doc.pop("_id", None)
    return {"assessment": doc}


@router.get("/{assessment_id}")
async def get_assessment(assessment_id: str, request: Request):
    """Fetch assessment workspace, challenge description, and initial state."""
    db: AsyncIOMotorDatabase = db_from(request)
    doc = await db.assessments.find_one({"assessment_id": assessment_id})
    if not doc:
        # Check if candidate slug was passed
        cand_slug = assessment_id.replace("asm-", "")
        cand = await db.candidates.find_one({"slug": cand_slug})
        if cand:
            return await init_assessment(AssessmentInitIn(candidate_id=cand["slug"]), request)

        # Check if assessment_id matches a challenge or default challenge
        challenge_key = assessment_id if assessment_id in CHALLENGES else "two-sum"
        challenge = CHALLENGES[challenge_key]
        now = datetime.now(timezone.utc)
        doc = {
            "assessment_id": assessment_id,
            "candidate_id": "candidate-eval",
            "candidate_name": "Technical Candidate",
            "role": "Software Engineer",
            "challenge_id": challenge["id"],
            "challenge_title": challenge["title"],
            "difficulty": challenge["difficulty"],
            "status": "IN_PROGRESS",
            "language": "python",
            "submitted_code": challenge["starter_code"]["python"],
            "test_results": None,
            "pass_percentage": 0,
            "proctoring_violations": [],
            "proctoring_risk": {"risk_score": 0, "risk_level": "LOW", "total_violations": 0},
            "created_at": now.isoformat(),
            "submitted_at": None,
        }
        await db.assessments.insert_one(doc)

    doc.pop("_id", None)
    challenge = CHALLENGES.get(doc.get("challenge_id", "two-sum"), CHALLENGES["two-sum"])
    return {
        "assessment": doc,
        "challenge": {
            "id": challenge["id"],
            "title": challenge["title"],
            "difficulty": challenge["difficulty"],
            "category": challenge["category"],
            "description": challenge["description"],
            "starter_code": challenge["starter_code"],
            "sample_test_cases": challenge["sample_test_cases"],
        },
    }


@router.post("/{assessment_id}/run")
async def run_assessment_code(assessment_id: str, body: RunCodeIn, request: Request):
    """Run candidate code against sample test cases (sandboxed Judge0 execution)."""
    db: AsyncIOMotorDatabase = db_from(request)
    doc = await db.assessments.find_one({"assessment_id": assessment_id})
    if not doc:
        raise ApiError(404, "Assessment session not found")

    challenge = CHALLENGES.get(doc.get("challenge_id", "two-sum"), CHALLENGES["two-sum"])
    sample_tests = challenge["sample_test_cases"]

    result = await run_test_cases(body.source_code, body.language, sample_tests)
    return {"status": "ok", "test_run": result}


@router.post("/{assessment_id}/submit")
async def submit_assessment(assessment_id: str, body: SubmitCodeIn, request: Request):
    """Submit code against all sample and hidden test cases, compute pass score, and finalize."""
    db: AsyncIOMotorDatabase = db_from(request)
    doc = await db.assessments.find_one({"assessment_id": assessment_id})
    if not doc:
        raise ApiError(404, "Assessment session not found")

    challenge = CHALLENGES.get(doc.get("challenge_id", "two-sum"), CHALLENGES["two-sum"])
    all_tests = challenge["sample_test_cases"] + challenge["hidden_test_cases"]

    result = await run_test_cases(body.source_code, body.language, all_tests)
    status = "PASSED" if result["all_passed"] else "FAILED"
    now = datetime.now(timezone.utc)

    await db.assessments.update_one(
        {"assessment_id": assessment_id},
        {
            "$set": {
                "status": status,
                "language": body.language,
                "submitted_code": body.source_code,
                "test_results": result,
                "pass_percentage": result["pass_percentage"],
                "submitted_at": now.isoformat(),
            }
        },
    )

    # If passed, advance candidate stage in MongoDB
    cand_slug = doc.get("candidate_id")
    if cand_slug:
        cand = await db.candidates.find_one({"slug": cand_slug})
        if cand:
            next_stage = "INTERVIEW" if status == "PASSED" else cand.get("stage", "ASSESSMENT")
            await db.candidates.update_one(
                {"slug": cand_slug},
                {"$set": {"stage": next_stage, "assessment_score": result["pass_percentage"]}},
            )
            # Broadcast update via WebSocket
            await broadcast_ws_event(
                "candidate:stage",
                {"candidate_id": cand_slug, "stage": next_stage, "assessment_score": result["pass_percentage"]},
            )

    updated = await db.assessments.find_one({"assessment_id": assessment_id})
    updated.pop("_id", None)
    return {"status": "ok", "assessment": updated, "evaluation": result}


@router.post("/{assessment_id}/proctor-event")
async def receive_proctor_event(assessment_id: str, body: ProctorEventIn, request: Request):
    """Receive proctoring violation telemetry and persist snapshot to MinIO."""
    db: AsyncIOMotorDatabase = db_from(request)
    minio_client = getattr(request.app.state, "minio", None)

    res = await log_proctor_violation(
        db=db,
        assessment_id=assessment_id,
        violation_type=body.type,
        detail=body.detail,
        snapshot_base64=body.snapshot_base64,
        minio_client=minio_client,
    )

    # Broadcast proctoring alert to recruiters via WebSocket
    await broadcast_ws_event(
        "proctor:alert",
        {"assessment_id": assessment_id, "violation": res["violation"], "risk": res["risk"]},
    )

    return {"status": "ok", **res}


@router.get("/{assessment_id}/evidence/{evidence_path:path}")
async def get_proctoring_evidence(assessment_id: str, evidence_path: str, request: Request):
    """Retrieve proctoring evidence snapshot from MinIO."""
    minio_client = getattr(request.app.state, "minio", None)
    if not minio_client:
        raise ApiError(503, "Object storage not available")

    try:
        data_stream = minio_client.get_object(EVIDENCE_BUCKET, evidence_path)
        content = data_stream.read()
        return Response(content=content, media_type="image/jpeg")
    except Exception as exc:
        raise ApiError(404, f"Evidence object not found: {exc}")
