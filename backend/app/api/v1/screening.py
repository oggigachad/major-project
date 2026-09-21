"""Evalix AI Screening API Endpoints (Step 7).

Endpoints:
- POST /api/v1/screening/resume/{candidate_id}
- POST /api/v1/screening/job/{job_id}
- POST /api/v1/screening/{job_id}/{candidate_id}
- GET /api/v1/screening/{job_id}/candidates
- GET /api/v1/screening/{job_id}/candidate/{candidate_id}
- POST /api/v1/screening/{job_id}/run
"""

import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import db_from, get_payload
from app.api.v1.ws import broadcast_ws_event
from app.core.guards import ApiError
from app.services import screen_service
from app.services.evalix_screening.profile_parser import parse_job_profile, parse_resume_profile
from app.services.evalix_screening.ranker import rank_screened_candidates

router = APIRouter(prefix="/screening", tags=["screening"])


@router.post("/resume/{candidate_id}")
async def parse_candidate_resume(
    candidate_id: str,
    request: Request,
    claims: Dict[str, Any] = Depends(get_payload),
):
    """Extract and parse structured candidate profile from resume/text."""
    db: AsyncIOMotorDatabase = db_from(request)
    candidate = await db.candidates.find_one({"slug": candidate_id})
    if not candidate:
        raise ApiError(404, "Candidate not found")

    text = screen_service.candidate_text(candidate)
    profile = parse_resume_profile(text)

    # Merge skills into candidate doc
    all_skills = sorted(list(set((candidate.get("matched") or []) + profile["skills"])))
    await db.candidates.update_one(
        {"slug": candidate_id},
        {"$set": {"matched": all_skills, "parsed_profile": profile}},
    )

    return {
        "candidate_id": candidate_id,
        "profile": profile,
        "skills": all_skills,
    }


@router.post("/job/{job_id}")
async def parse_job_description(
    job_id: str,
    request: Request,
    claims: Dict[str, Any] = Depends(get_payload),
):
    """Extract structured screening criteria from a job posting."""
    db: AsyncIOMotorDatabase = db_from(request)
    job = await db.jobs.find_one({"slug": job_id})
    if not job:
        raise ApiError(404, "Job not found")

    profile = parse_job_profile(job)
    await db.jobs.update_one(
        {"slug": job_id},
        {"$set": {"screening_profile": profile}},
    )

    return {
        "job_id": job_id,
        "screening_profile": profile,
    }


@router.post("/{job_id}/{candidate_id}")
async def screen_candidate(
    job_id: str,
    candidate_id: str,
    request: Request,
    claims: Dict[str, Any] = Depends(get_payload),
):
    """Run full Evalix screening for a single candidate against a job."""
    db: AsyncIOMotorDatabase = db_from(request)
    job = await db.jobs.find_one({"slug": job_id})
    if not job:
        raise ApiError(404, "Job not found")

    candidate = await db.candidates.find_one({"slug": candidate_id})
    if not candidate:
        raise ApiError(404, "Candidate not found")

    qdrant = getattr(request.app.state, "qdrant", None)
    result = await screen_service.screen_single_candidate(db, qdrant, job, candidate)

    # Clean MongoDB _id before returning
    result.pop("_id", None)

    await broadcast_ws_event(
        "notification:new",
        {
            "id": f"notif-{uuid.uuid4().hex[:6]}",
            "title": "Candidate Screened",
            "message": f"{candidate['name']} scored {result['overall_score']}% for {job['title']}",
            "time": "just now",
            "tone": "olive" if result["overall_score"] >= 75 else "amber",
        },
    )

    return result


@router.get("/{job_id}/candidates")
async def get_screened_candidates(
    job_id: str,
    request: Request,
    claims: Dict[str, Any] = Depends(get_payload),
):
    """Retrieve all screened candidates for a job, ranked."""
    db: AsyncIOMotorDatabase = db_from(request)
    job = await db.jobs.find_one({"slug": job_id})
    if not job:
        raise ApiError(404, "Job not found")

    cursor = db.screening_results.find({"job_id": job_id})
    raw_results = [r async for r in cursor]

    for r in raw_results:
        r.pop("_id", None)

    ranked = rank_screened_candidates(job_id=job_id, screened_items=raw_results)
    return ranked


@router.get("/{job_id}/candidate/{candidate_id}")
async def get_candidate_screening_detail(
    job_id: str,
    candidate_id: str,
    request: Request,
    claims: Dict[str, Any] = Depends(get_payload),
):
    """Retrieve full screening breakdown for a specific candidate and job."""
    db: AsyncIOMotorDatabase = db_from(request)
    result = await db.screening_results.find_one(
        {"job_id": job_id, "candidate_id": candidate_id}
    )
    if not result:
        # If not yet screened, run it on demand
        job = await db.jobs.find_one({"slug": job_id})
        candidate = await db.candidates.find_one({"slug": candidate_id})
        if not job or not candidate:
            raise ApiError(404, "Job or candidate not found")
        qdrant = getattr(request.app.state, "qdrant", None)
        result = await screen_service.screen_single_candidate(db, qdrant, job, candidate)

    result.pop("_id", None)
    return result


@router.post("/{job_id}/run")
async def run_screening_batch(
    job_id: str,
    request: Request,
    claims: Dict[str, Any] = Depends(get_payload),
):
    """Run full screening batch across all candidates for a job."""
    db: AsyncIOMotorDatabase = db_from(request)
    job = await db.jobs.find_one({"slug": job_id})
    if not job:
        raise ApiError(404, "Job not found")

    qdrant = getattr(request.app.state, "qdrant", None)
    screening_output = await screen_service.screen_job(db, qdrant, job, limit=20)

    await broadcast_ws_event(
        "notification:new",
        {
            "id": f"notif-{uuid.uuid4().hex[:6]}",
            "title": "Batch Screening Complete",
            "message": f"Screened {len(screening_output.get('candidates', []))} candidates for {job['title']}",
            "time": "just now",
            "tone": "olive",
        },
    )

    return {
        "job_id": job_id,
        "status": "completed",
        "engine": screening_output.get("engine"),
        "candidates": screening_output.get("candidates", []),
    }
