"""Candidate endpoints: list (search / stage / sort), shortlist toggle and
the server-owned stage state machine (advance / reject / restore)."""

from datetime import datetime, timezone
import re
from typing import Any, Dict, Optional
import uuid

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from fastapi.responses import JSONResponse as Resp

from app.services.evalix_screening.extractor import extract_resume_text
from app.services.evalix_screening.profile_parser import parse_job_profile, parse_resume_profile
from app.services.evalix_screening.matcher import match_candidate_to_job
from app.services.evalix_screening.llm_screener import screen_candidate_llm
from app.services.screen_service import upsert_candidate_vector

from app.api.deps import db_from, get_payload, redis_from
from app.api.v1.ws import broadcast_ws_event
from app.core.config import get_settings
from app.core.guards import ApiError, origin_allowed
from app.schemas.requests import CandidateCreateIn, ShortlistIn, StageActionIn
from app.serializers import serialize_candidate
from app.services import auth_service
from app.services.stats_service import get_stats, invalidate_stats_cache

settings = get_settings()
router = APIRouter(prefix="/candidates", tags=["candidates"])

STAGES = ["screening", "assessment", "interview", "offer", "hired", "rejected"]
SORTS = ["match", "recent", "name"]
FLOW = ["SCREENING", "ASSESSMENT", "INTERVIEW", "OFFER", "HIRED"]



@router.get("")
async def list_candidates(
    request: Request,
    search: str = Query(default="", max_length=120),
    stage: str = Query(default="all"),
    sort: str = Query(default="match"),
    claims: Dict[str, Any] = Depends(get_payload),
):
    db = db_from(request)

    if sort not in SORTS:
        raise ApiError(400, f"Invalid sort — use one of {', '.join(SORTS)}")
    if stage != "all" and stage not in STAGES:
        raise ApiError(400, f"Invalid stage — use one of {', '.join(STAGES)}")

    query: Dict[str, Any] = {}
    if stage != "all":
        query["stage"] = stage.upper()
    if search.strip():
        rx = re.compile(re.escape(search.strip().lower()), re.IGNORECASE)
        query["$or"] = [{"name": rx}, {"role": rx}, {"email": rx}]

    order = (
        [("match", -1)] if sort == "match"
        else [("applied_days_ago", 1)] if sort == "recent"
        else [("name", 1)]
    )
    rows = [d async for d in db.candidates.find(query).sort(order)]

    return {"candidates": [serialize_candidate(r) for r in rows], "total": len(rows)}


@router.patch("/{slug}")
async def toggle_shortlist(slug: str, body: ShortlistIn, request: Request,
                           claims: Dict[str, Any] = Depends(get_payload)):
    if not origin_allowed(request):
        raise ApiError(403, "Cross-origin request rejected")

    db = db_from(request)
    redis = redis_from(request)

    candidate = await db.candidates.find_one({"slug": slug})
    if not candidate:
        raise ApiError(404, "Candidate not found")

    await db.candidates.update_one(
        {"slug": slug}, {"$set": {"shortlisted": body.shortlisted}}
    )

    # Keep the current week's shortlist metric honest when starring.
    if body.shortlisted and not candidate.get("shortlisted"):
        latest = await db.metric_weekly.find_one(sort=[("week_index", -1)])
        if latest:
            await db.metric_weekly.update_one(
                {"week_label": latest["week_label"]}, {"$inc": {"shortlisted": 1}}
            )

    await invalidate_stats_cache(redis)
    updated = await db.candidates.find_one({"slug": slug})
    ser_cand = serialize_candidate(updated)
    fresh_stats = await get_stats(db, redis, force=True)

    await broadcast_ws_event("candidate:updated", ser_cand)
    await broadcast_ws_event("stats:updated", fresh_stats)
    await broadcast_ws_event(
        "notification:new",
        {
            "id": f"notif-{uuid.uuid4().hex[:6]}",
            "title": "Shortlist Updated",
            "message": f"{updated['name']} {'starred' if body.shortlisted else 'removed from shortlist'}",
            "time": "just now",
            "tone": "olive" if body.shortlisted else "ink",
        },
    )
    return {"candidate": ser_cand}


@router.post("/{slug}/stage")
async def stage_action(slug: str, body: StageActionIn, request: Request,
                       claims: Dict[str, Any] = Depends(get_payload)):
    if not origin_allowed(request):
        raise ApiError(403, "Cross-origin request rejected")

    db = db_from(request)
    redis = redis_from(request)

    candidate = await db.candidates.find_one({"slug": slug})
    if not candidate:
        raise ApiError(404, "Candidate not found")

    stage = candidate.get("stage", "SCREENING")
    detail_from = f"{candidate['name']}: {stage}"

    if body.action == "advance":
        if stage == "REJECTED":
            raise ApiError(409, "Candidate was rejected — restore them first")
        try:
            idx = FLOW.index(stage)
        except ValueError:
            idx = -1
        if idx == -1 or idx == len(FLOW) - 1:
            raise ApiError(409, f"Candidate is already {stage.lower()}")
        next_stage = FLOW[idx + 1]
        await db.candidates.update_one(
            {"slug": slug},
            {"$set": {"stage": next_stage, "updated_minutes_ago": 0, "previous_stage": None}},
        )
        await auth_service.log_activity(
            db, claims["sub"], "stage_change", f"{detail_from} → {next_stage}"
        )
        notif_title = f"{candidate['name']} Advanced"
        notif_msg = f"Moved to {next_stage.title()} stage"
        notif_tone = "olive"

    elif body.action == "reject":
        if stage == "REJECTED":
            raise ApiError(409, "Candidate is already rejected")
        await db.candidates.update_one(
            {"slug": slug},
            {"$set": {"stage": "REJECTED", "previous_stage": stage, "updated_minutes_ago": 0}},
        )
        await auth_service.log_activity(
            db, claims["sub"], "stage_change", f"{detail_from} → REJECTED"
        )
        notif_title = f"{candidate['name']} Rejected"
        notif_msg = "Moved to Rejected stage"
        notif_tone = "amber"

    else:  # restore (undo reject)
        if stage != "REJECTED":
            raise ApiError(409, "Only rejected candidates can be restored")
        restored_stage = candidate.get("previous_stage") or "SCREENING"
        await db.candidates.update_one(
            {"slug": slug},
            {"$set": {"stage": restored_stage, "previous_stage": None, "updated_minutes_ago": 0}},
        )
        await auth_service.log_activity(
            db, claims["sub"], "stage_change", f"{detail_from} → {restored_stage}"
        )
        notif_title = f"{candidate['name']} Restored"
        notif_msg = f"Restored back to {restored_stage.title()}"
        notif_tone = "olive"

    await invalidate_stats_cache(redis)
    updated = await db.candidates.find_one({"slug": slug})
    ser_cand = serialize_candidate(updated)
    fresh_stats = await get_stats(db, redis, force=True)

    await broadcast_ws_event("candidate:updated", ser_cand)
    await broadcast_ws_event("stats:updated", fresh_stats)
    await broadcast_ws_event(
        "notification:new",
        {
            "id": f"notif-{uuid.uuid4().hex[:6]}",
            "title": notif_title,
            "message": notif_msg,
            "time": "just now",
            "tone": notif_tone,
        },
    )
    return {"candidate": ser_cand}


@router.post("", status_code=201)
async def create_candidate(body: CandidateCreateIn, request: Request,
                           claims: Dict[str, Any] = Depends(get_payload)):
    if not origin_allowed(request):
        raise ApiError(403, "Cross-origin request rejected")

    db = db_from(request)
    redis = redis_from(request)
    now = datetime.now(timezone.utc)

    # Resolve job
    job_id = body.job_id
    if not job_id:
        first_job = await db.jobs.find_one({"status": "OPEN"})
        job_id = first_job["slug"] if first_job else "fe"

    stage_upper = (body.stage or "screening").upper()
    if stage_upper not in FLOW and stage_upper != "REJECTED":
        stage_upper = "SCREENING"

    matched = body.matched if body.matched is not None else ["TypeScript", "System Design", "Testing"]
    missing = body.missing if body.missing is not None else ["Domain expertise"]
    match_score = min(98, max(72, 75 + len(matched) * 4 - len(missing) * 2))

    slug = f"c-{uuid.uuid4().hex[:8]}"
    doc = {
        "slug": slug,
        "name": body.name,
        "email": body.email,
        "role": body.role,
        "job_id": job_id,
        "location": body.location or "Remote",
        "applied_days_ago": 0,
        "updated_minutes_ago": 0,
        "stage": stage_upper,
        "match": match_score,
        "resume_score": match_score + 2,
        "assessment_score": match_score - 3,
        "interview_score": 0,
        "task_score": 0,
        "source": body.source or "Direct Application",
        "shortlisted": False,
        "summary": body.summary or f"Application submitted for {body.role}. Demonstrates solid background and relevant technical skills.",
        "matched": matched,
        "missing": missing,
        "assessment_sections": [
            {"label": "Core Competency", "score": match_score},
            {"label": "Problem Solving", "score": match_score - 4},
        ],
        "interview": None,
        "task": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.candidates.insert_one(doc)

    # Increment the job's pipeline applied count
    await db.jobs.update_one({"slug": job_id}, {"$inc": {"pipeline.0": 1}})

    await auth_service.log_activity(
        db, claims["sub"], "candidate_created", f"{body.name} applied for {body.role}"
    )
    await invalidate_stats_cache(redis)

    ser_cand = serialize_candidate(doc)
    fresh_stats = await get_stats(db, redis, force=True)

    await broadcast_ws_event("candidate:created", ser_cand)
    await broadcast_ws_event("stats:updated", fresh_stats)
    await broadcast_ws_event(
        "notification:new",
        {
            "id": f"notif-{uuid.uuid4().hex[:6]}",
            "title": "New Applicant Received",
            "message": f"{body.name} applied for {body.role}",
            "time": "just now",
            "tone": "olive",
        },
    )
    return {"candidate": ser_cand}


@router.post("/upload", status_code=201)
async def upload_candidate_resume(
    request: Request,
    file: UploadFile = File(...),
    job_id: Optional[str] = Form(None),
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    claims: Dict[str, Any] = Depends(get_payload),
):
    """Candidate Resume Upload & Automatic Screening (Steps 2, 4, 5, 10, 12, 13, 14).

    Validates file format (magic bytes for PDF/DOC/DOCX), extracts text,
    parses candidate profile, matches against target job, evaluates via Evalix LLM
    or deterministic engine, and persists candidate and screening result.
    """
    db = db_from(request)
    redis = redis_from(request)
    now = datetime.now(timezone.utc)

    # 1. Read and validate file content
    try:
        content = await file.read()
    except Exception as exc:
        raise ApiError(400, f"Failed to read uploaded file: {exc}")

    if not content:
        raise ApiError(400, "Uploaded file is empty")

    filename = file.filename or "resume.pdf"
    try:
        raw_text, detected_fmt = extract_resume_text(filename, content)
    except ValueError as val_err:
        raise ApiError(400, str(val_err))
    except Exception as err:
        raise ApiError(400, f"Resume extraction error: {err}")

    # 2. Parse candidate profile
    cand_profile = parse_resume_profile(raw_text)

    # 3. Resolve target job
    target_job = None
    if job_id:
        target_job = await db.jobs.find_one({"slug": job_id})
    if not target_job:
        target_job = await db.jobs.find_one({"status": "OPEN"})
    if not target_job:
        target_job = await db.jobs.find_one({})

    resolved_job_id = target_job["slug"] if target_job else "fe"
    job_title = target_job["title"] if target_job else (role or "Software Engineer")

    # 4. Resolve candidate metadata (name, email, role)
    cand_name = name.strip() if name and name.strip() else None
    cand_email = email.strip().lower() if email and email.strip() else None
    cand_role = role.strip() if role and role.strip() else job_title

    if not cand_name:
        # Extract first 2-3 words of resume if looks like a name
        first_line = raw_text.splitlines()[0].strip() if raw_text.splitlines() else ""
        if 2 <= len(first_line.split()) <= 4 and len(first_line) < 40 and not any(ch in first_line for ch in "@:/"):
            cand_name = first_line
        else:
            cand_name = f"Applicant {uuid.uuid4().hex[:4].upper()}"

    if not cand_email:
        email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}", raw_text)
        cand_email = email_match.group(0).lower() if email_match else f"{uuid.uuid4().hex[:6]}@example.com"

    # 5. Run Evalix matching & screening against target job
    job_profile = parse_job_profile(target_job) if target_job else {
        "title": cand_role, "dept": "Engineering", "required_skills": cand_profile["skills"][:3],
        "preferred_skills": cand_profile["skills"][3:], "min_experience_years": 2.0,
        "min_education_level": 2, "education_degree": "Bachelor's Degree",
    }

    matching = match_candidate_to_job(
        candidate_id="",
        job_id=resolved_job_id,
        candidate_profile=cand_profile,
        job_profile=job_profile,
        candidate_raw_text=raw_text,
        job_raw_text=f"{job_profile.get('title')} {job_profile.get('dept')}",
    )

    llm_eval = await screen_candidate_llm(
        matching_result=matching,
        candidate_profile=cand_profile,
        job_profile=job_profile,
        candidate_raw_text=raw_text,
        candidate_name=cand_name,
    )

    slug = f"c-{uuid.uuid4().hex[:8]}"
    matching["candidate_id"] = slug

    # 6. Build Candidate Document
    doc = {
        "slug": slug,
        "name": cand_name,
        "email": cand_email,
        "role": cand_role,
        "job_id": resolved_job_id,
        "location": "Remote",
        "applied_days_ago": 0,
        "updated_minutes_ago": 0,
        "stage": "SCREENING",
        "match": matching["overall_score"],
        "resume_score": llm_eval["score"],
        "assessment_score": max(0, matching["overall_score"] - 5),
        "interview_score": 0,
        "task_score": 0,
        "source": "Resume Upload",
        "shortlisted": matching["overall_score"] >= 85,
        "summary": llm_eval["reasoning"],
        "matched": matching["matched_skills"],
        "missing": matching["missing_skills"],
        "parsed_profile": cand_profile,
        "assessment_sections": [
            {"label": "Technical Fit", "score": matching["skill_score"]},
            {"label": "Experience Alignment", "score": matching["experience_score"]},
            {"label": "Semantic Relevancy", "score": matching["semantic_score"]},
        ],
        "interview": None,
        "task": None,
        "created_at": now,
        "updated_at": now,
    }

    await db.candidates.insert_one(doc)

    # 7. Persist Screening Result (Step 8)
    screening_record = {
        "screening_id": f"scr-{uuid.uuid4().hex[:8]}",
        "candidate_id": slug,
        "job_id": resolved_job_id,
        "screening_version": "evalix-v1.0.0",
        "overall_score": matching["overall_score"],
        "screening_score": llm_eval["score"],
        "skill_score": matching["skill_score"],
        "experience_score": matching["experience_score"],
        "education_score": matching["education_score"],
        "semantic_score": matching["semantic_score"],
        "matched_skills": matching["matched_skills"],
        "missing_skills": matching["missing_skills"],
        "qualification_gaps": matching["qualification_gaps"],
        "recommendation": llm_eval["recommendation"],
        "reasoning": llm_eval["reasoning"],
        "strengths": llm_eval["strengths"],
        "concerns": llm_eval["concerns"],
        "missing_requirements": llm_eval["missing_requirements"],
        "model_provider": llm_eval.get("provider", "evalix"),
        "screening_timestamp": now.isoformat(),
        "status": "completed",
        "created_at": now,
    }
    await db.screening_results.insert_one(screening_record)

    # Update Job pipeline count
    if target_job:
        await db.jobs.update_one({"slug": resolved_job_id}, {"$inc": {"pipeline.0": 1}})

    # Upsert vector in Qdrant if available
    qdrant = getattr(request.app.state, "qdrant", None)
    await upsert_candidate_vector(qdrant, doc)

    await auth_service.log_activity(
        db, claims["sub"], "resume_screened", f"{cand_name} screened for {cand_role} ({matching['overall_score']}%)"
    )
    await invalidate_stats_cache(redis)

    ser_cand = serialize_candidate(doc)
    fresh_stats = await get_stats(db, redis, force=True)

    await broadcast_ws_event("candidate:created", ser_cand)
    await broadcast_ws_event("stats:updated", fresh_stats)
    await broadcast_ws_event(
        "notification:new",
        {
            "id": f"notif-{uuid.uuid4().hex[:6]}",
            "title": "Resume Screened (Evalix)",
            "message": f"{cand_name} scored {matching['overall_score']}% ({llm_eval['recommendation'].replace('_', ' ').title()})",
            "time": "just now",
            "tone": "olive" if matching["overall_score"] >= 75 else "amber",
        },
    )

    screening_record.pop("_id", None)
    return {
        "candidate": ser_cand,
        "screening": screening_record,
        "format": detected_fmt,
    }

