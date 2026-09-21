"""Evalix AI Interview API Endpoints.

Endpoints for candidate-facing voice & video interview sessions:
- POST /api/v1/interviews/sessions: Initialize or fetch interview session
- GET  /api/v1/interviews/{sessionId}: Retrieve session state & transcript
- POST /api/v1/interviews/{sessionId}/start: Start interview & initial greeting
- POST /api/v1/interviews/{sessionId}/respond: Submit candidate response & get AI question
- POST /api/v1/interviews/{sessionId}/complete: Finalize interview, compute scorecard & persist
"""

from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from app.api.deps import db_from, redis_from
from app.api.v1.ws import broadcast_ws_event
from app.core.guards import ApiError
from app.serializers import serialize_candidate
from app.services.evalix_interview.interview_engine import (
    generate_followup,
    get_role_questions,
    strip_thinking,
)
from app.services.evalix_interview.scoring_engine import evaluate_interview_transcript
from app.services.stats_service import get_stats, invalidate_stats_cache

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.get("")
async def list_interviews(request: Request, status: str = "all"):
    """List all interview sessions with optional status filter."""
    db = db_from(request)
    query = {}
    if status and status != "all":
        query["status"] = status.upper()
    sessions = [s async for s in db.interview_sessions.find(query).sort("created_at", -1)]
    for s in sessions:
        s.pop("_id", None)
    return {"interviews": sessions, "total": len(sessions)}


class SessionInitIn(BaseModel):
    candidate_id: str
    job_id: Optional[str] = None


class RespondIn(BaseModel):
    text: str = Field(min_length=1)


@router.post("/sessions", status_code=201)
async def create_or_get_session(body: SessionInitIn, request: Request):
    """Initialize an interview session for candidate."""
    db = db_from(request)
    candidate = await db.candidates.find_one({"slug": body.candidate_id})
    if not candidate:
        raise ApiError(404, "Candidate not found")

    job_slug = body.job_id or candidate.get("job_id")
    job = await db.jobs.find_one({"slug": job_slug}) if job_slug else None
    role_title = candidate.get("role") or (job.get("title") if job else "Software Engineer")

    # Check for existing active session
    existing = await db.interview_sessions.find_one({
        "candidate_id": body.candidate_id,
        "status": {"$in": ["READY", "IN_PROGRESS"]},
    })
    if existing:
        existing.pop("_id", None)
        return {"session": existing}

    session_id = f"int-{uuid.uuid4().hex[:8]}"
    questions = get_role_questions(role_title)
    now = datetime.now(timezone.utc)

    session_doc = {
        "session_id": session_id,
        "candidate_id": body.candidate_id,
        "candidate_name": candidate.get("name"),
        "role_title": role_title,
        "job_id": job_slug,
        "status": "READY",
        "current_question_index": 0,
        "questions": questions,
        "transcript": [],
        "created_at": now,
        "started_at": None,
        "ended_at": None,
    }

    await db.interview_sessions.insert_one(session_doc)
    session_doc.pop("_id", None)
    return {"session": session_doc}


@router.get("/{session_id}")
async def get_session(session_id: str, request: Request):
    """Retrieve interview session data and transcript."""
    db = db_from(request)
    session = await db.interview_sessions.find_one({"session_id": session_id})
    if not session:
        # Check if session_id is of form int-<candidate_slug>
        cand_slug = session_id.replace("int-", "")
        cand = await db.candidates.find_one({"slug": cand_slug})
        if cand:
            # Auto-initialize session for candidate
            init_res = await create_or_get_session(SessionInitIn(candidate_id=cand["slug"]), request)
            return init_res
        raise ApiError(404, "Interview session not found")

    session.pop("_id", None)
    return {"session": session}


@router.post("/{session_id}/start")
async def start_interview(session_id: str, request: Request):
    """Start interview session, generating greeting and first question."""
    db = db_from(request)
    session = await db.interview_sessions.find_one({"session_id": session_id})
    if not session:
        raise ApiError(404, "Interview session not found")

    now = datetime.now(timezone.utc)
    questions = session.get("questions") or get_role_questions(session.get("role_title", "Software Engineer"))
    first_q = questions[0]["text"]

    welcome_text = (
        f"Hello {session.get('candidate_name', 'there')}! Welcome to your technical interview for the "
        f"{session.get('role_title', 'Software Engineer')} position. Let's begin with our first question: {first_q}"
    )

    transcript = [
        {
            "id": f"msg-{uuid.uuid4().hex[:6]}",
            "role": "assistant",
            "content": welcome_text,
            "timestamp": now.isoformat(),
        }
    ]

    await db.interview_sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "status": "IN_PROGRESS",
                "started_at": now,
                "current_question_index": 0,
                "transcript": transcript,
            }
        },
    )

    return {
        "status": "IN_PROGRESS",
        "current_question_index": 0,
        "question": questions[0],
        "ai_message": welcome_text,
        "transcript": transcript,
    }


@router.post("/{session_id}/respond")
async def respond_to_question(session_id: str, body: RespondIn, request: Request):
    """Receive candidate response, generate AI follow-up or next question."""
    db = db_from(request)
    session = await db.interview_sessions.find_one({"session_id": session_id})
    if not session:
        raise ApiError(404, "Interview session not found")

    now = datetime.now(timezone.utc)
    transcript = session.get("transcript", [])
    questions = session.get("questions", [])
    curr_idx = session.get("current_question_index", 0)

    # Record candidate response
    cand_msg = {
        "id": f"msg-{uuid.uuid4().hex[:6]}",
        "role": "user",
        "content": body.text.strip(),
        "timestamp": now.isoformat(),
    }
    transcript.append(cand_msg)

    # Generate follow-up / next question
    curr_q = questions[curr_idx] if curr_idx < len(questions) else {"text": "General question"}
    followup_info = generate_followup(
        candidate_answer=body.text,
        current_question=curr_q,
        question_idx=curr_idx,
        total_questions=len(questions),
    )

    is_complete = followup_info["is_complete"]
    next_idx = curr_idx + 1 if not is_complete else curr_idx

    if is_complete:
        ai_reply = (
            f"{followup_info['acknowledgement']} That concludes all the questions for today's interview session. "
            f"You can now click 'End Interview' to finalize and view your evaluation summary."
        )
    else:
        next_q = questions[next_idx]
        ai_reply = f"{followup_info['acknowledgement']} Moving to the next question: {next_q['text']}"

    ai_msg = {
        "id": f"msg-{uuid.uuid4().hex[:6]}",
        "role": "assistant",
        "content": ai_reply,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    transcript.append(ai_msg)

    await db.interview_sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "current_question_index": next_idx,
                "transcript": transcript,
                "status": "COMPLETED" if is_complete else "IN_PROGRESS",
            }
        },
    )

    return {
        "status": "COMPLETED" if is_complete else "IN_PROGRESS",
        "is_complete": is_complete,
        "current_question_index": next_idx,
        "ai_message": ai_reply,
        "transcript": transcript,
    }


@router.post("/{session_id}/complete")
async def complete_interview(session_id: str, request: Request):
    """Finalize interview session, compute scorecard, persist to candidate record."""
    db = db_from(request)
    redis = redis_from(request)
    session = await db.interview_sessions.find_one({"session_id": session_id})
    if not session:
        raise ApiError(404, "Interview session not found")

    now = datetime.now(timezone.utc)
    started_at = session.get("started_at") or now
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    duration_secs = max(120, int((now - started_at).total_seconds()))

    transcript = session.get("transcript", [])
    scorecard = evaluate_interview_transcript(
        transcript=transcript,
        role=session.get("role_title", "Software Engineer"),
        duration_seconds=duration_secs,
    )

    # Persist in session
    await db.interview_sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "status": "COMPLETED",
                "ended_at": now,
                "duration_seconds": duration_secs,
                "scorecard": scorecard,
            }
        },
    )

    # Update candidate in db.candidates
    cand_slug = session.get("candidate_id")
    candidate = await db.candidates.find_one({"slug": cand_slug})
    if candidate:
        interview_data = {
            "when": "Today",
            "minutes": scorecard["minutes"],
            "verdict": scorecard["verdict"],
            "strengths": scorecard["strengths"],
            "improvements": scorecard["improvements"],
            "quote": scorecard["quote"],
        }
        await db.candidates.update_one(
            {"slug": cand_slug},
            {
                "$set": {
                    "interview": interview_data,
                    "interview_score": scorecard["overall_score"],
                    "stage": "INTERVIEW",
                    "updated_minutes_ago": 0,
                }
            },
        )
        await invalidate_stats_cache(redis)
        updated_cand = await db.candidates.find_one({"slug": cand_slug})
        ser_cand = serialize_candidate(updated_cand)
        fresh_stats = await get_stats(db, redis, force=True)
        await broadcast_ws_event("candidate:updated", ser_cand)
        await broadcast_ws_event("stats:updated", fresh_stats)

    await broadcast_ws_event(
        "notification:new",
        {
            "id": f"notif-{uuid.uuid4().hex[:6]}",
            "title": "Interview Completed",
            "message": f"{session.get('candidate_name')} completed interview ({scorecard['overall_score']}%)",
            "time": "just now",
            "tone": "olive",
        },
    )

    return {
        "status": "COMPLETED",
        "session_id": session_id,
        "scorecard": scorecard,
        "transcript": transcript,
    }
