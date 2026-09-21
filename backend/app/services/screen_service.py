"""AI screening — semantic candidate matching and Evalix ranking pipeline.

Features:
- Evalix matching funnel (qualification check, skill match, experience, education, semantic)
- Evalix LLM screening evaluation with offline deterministic fallback
- Deterministic multi-criteria ranking
- Vector search with Qdrant when available
- Versioned database persistence in `screening_results`
- Full backwards-compatibility with the existing EvalixAI UI
"""

from datetime import datetime, timezone
import hashlib
import logging
import re
import uuid
from typing import Any, Dict, List, Optional

import httpx
from motor.motor_asyncio import AsyncIOMotorDatabase
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models as qmodels

from app.core.config import get_settings
from app.services.evalix_screening.profile_parser import parse_job_profile, parse_resume_profile
from app.services.evalix_screening.matcher import match_candidate_to_job
from app.services.evalix_screening.llm_screener import screen_candidate_llm
from app.services.evalix_screening.ranker import rank_screened_candidates

log = logging.getLogger("evalix.screen")
settings = get_settings()

SCREENING_VERSION = "evalix-v1.0.0"
_TOKEN_RE = re.compile(r"[a-z0-9+#.]+")


def point_id(slug: str) -> str:
    """Deterministic UUID for a candidate slug."""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"evalixai:{slug}"))


def _tokens(text: str) -> List[str]:
    return _TOKEN_RE.findall(text.lower())


def heuristic_embed(text: str, dim: int) -> List[float]:
    """Deterministic feature-hashing embedding (L2-normalised)."""
    vec = [0.0] * dim
    for tok in _tokens(text):
        idx = int(hashlib.sha256(tok.encode()).hexdigest(), 16) % dim
        vec[idx] += 1.0
    norm = sum(v * v for v in vec) ** 0.5 or 1.0
    return [v / norm for v in vec]


async def embed(text: str) -> List[float]:
    """Embed via the configured AI provider, falling back offline."""
    if settings.ai_provider == "kodekloud" and settings.kodekloud_api_base_url:
        try:
            async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
                r = await client.post(
                    f"{settings.kodekloud_api_base_url.rstrip('/')}/embeddings",
                    json={"input": text},
                    headers={"Authorization": f"Bearer {settings.kodekloud_api_key}"},
                )
                r.raise_for_status()
                data = r.json()["data"][0]["embedding"]
                return [float(x) for x in data]
        except Exception as exc:
            log.warning("kodekloud embedding failed (%s) — using offline embedder", exc)
    return heuristic_embed(text, settings.embedding_dim)


def candidate_text(row: Dict[str, Any]) -> str:
    return " ".join(
        [
            row.get("role", ""),
            row.get("name", ""),
            " ".join(row.get("matched") or []),
            " ".join(row.get("missing") or []),
            row.get("summary", ""),
        ]
    )


def job_text(row: Dict[str, Any]) -> str:
    return " ".join([row.get("title", ""), row.get("dept", ""), row.get("location", "")])


async def upsert_candidate_vector(
    qdrant: Optional[AsyncQdrantClient], row: Dict[str, Any]
) -> bool:
    if qdrant is None:
        return False
    try:
        vector = heuristic_embed(candidate_text(row), settings.embedding_dim)
        await qdrant.upsert(
            collection_name=settings.qdrant_collection,
            points=[
                qmodels.PointStruct(
                    id=point_id(row["slug"]),
                    vector=vector,
                    payload={
                        "slug": row["slug"],
                        "name": row.get("name"),
                        "role": row.get("role"),
                        "stage": row.get("stage"),
                        "match": row.get("match", 0),
                    },
                )
            ],
        )
        return True
    except Exception as exc:
        log.warning("vector upsert failed for %s: %s", row.get("slug"), exc)
        return False


async def screen_single_candidate(
    db: AsyncIOMotorDatabase,
    qdrant: Optional[AsyncQdrantClient],
    job: Dict[str, Any],
    candidate: Dict[str, Any],
) -> Dict[str, Any]:
    """Screen an individual candidate against a job using Evalix pipeline and persist."""
    job_profile = parse_job_profile(job)
    cand_text = candidate_text(candidate)

    # Candidate profile parsing
    cand_profile = parse_resume_profile(cand_text)
    # Merge any explicit skills recorded on candidate
    if candidate.get("matched"):
        cand_profile["skills"] = sorted(list(set(cand_profile["skills"] + candidate["matched"])))

    # Compute semantic score from Qdrant or heuristic
    semantic_score_override = -1.0
    if qdrant is not None:
        try:
            job_vec = heuristic_embed(job_text(job), settings.embedding_dim)
            cand_vec = heuristic_embed(cand_text, settings.embedding_dim)
            dot = sum(a * b for a, b in zip(job_vec, cand_vec))
            semantic_score_override = max(0.0, min(1.0, dot))
        except Exception:
            pass

    # Run Evalix matching
    matching = match_candidate_to_job(
        candidate_id=candidate["slug"],
        job_id=job["slug"],
        candidate_profile=cand_profile,
        job_profile=job_profile,
        candidate_raw_text=cand_text,
        job_raw_text=job_text(job),
        semantic_score_override=semantic_score_override,
    )

    # Run LLM screening (or offline fallback)
    llm_eval = await screen_candidate_llm(
        matching_result=matching,
        candidate_profile=cand_profile,
        job_profile=job_profile,
        candidate_raw_text=cand_text,
        candidate_name=candidate.get("name"),
    )

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # Step 8: Persist screening result into MongoDB `screening_results`
    record = {
        "screening_id": f"scr-{uuid.uuid4().hex[:8]}",
        "candidate_id": candidate["slug"],
        "job_id": job["slug"],
        "screening_version": SCREENING_VERSION,
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
        "screening_timestamp": now_iso,
        "status": "completed",
        "created_at": now,
    }

    # Upsert the screening result for candidate and job
    await db.screening_results.update_one(
        {"candidate_id": candidate["slug"], "job_id": job["slug"]},
        {"$set": record},
        upsert=True,
    )

    # Update candidate document match & summary
    await db.candidates.update_one(
        {"slug": candidate["slug"]},
        {
            "$set": {
                "match": matching["overall_score"],
                "resume_score": llm_eval["score"],
                "matched": matching["matched_skills"],
                "missing": matching["missing_skills"],
                "summary": llm_eval["reasoning"],
                "updated_minutes_ago": 0,
            }
        },
    )

    return record


async def screen_job(
    db: AsyncIOMotorDatabase,
    qdrant: Optional[AsyncQdrantClient],
    job: Dict[str, Any],
    limit: int = 10,
) -> Dict[str, Any]:
    """Run full Evalix AI screening & ranking for candidates on a job.

    Maintains dual compatibility:
    - 'results': format expected by the existing frontend ScreenModal
    - 'candidates': format expected by the Evalix ranking spec
    """
    engine = "heuristic"
    vector_scores: Dict[str, float] = {}

    if qdrant is not None:
        try:
            vector = heuristic_embed(job_text(job), settings.embedding_dim)
            resp = await qdrant.query_points(
                collection_name=settings.qdrant_collection,
                query=vector,
                limit=limit * 2,
                with_payload=True,
            )
            for h in resp.points:
                slug = (h.payload or {}).get("slug") or str(h.id)
                vector_scores[slug] = float(h.score)
            if vector_scores:
                engine = "qdrant"
        except Exception as exc:
            log.warning("Qdrant query failed: %s", exc)

    # Fetch candidates not rejected
    cands = [c async for c in db.candidates.find({"stage": {"$ne": "REJECTED"}})]
    if not cands:
        return {
            "job": job.get("slug"),
            "job_id": job.get("slug"),
            "engine": f"evalix+{engine}",
            "candidates": [],
            "results": [],
        }

    job_profile = parse_job_profile(job)
    screened_items: List[Dict[str, Any]] = []
    candidate_lookup: Dict[str, Dict[str, Any]] = {}

    for cand in cands:
        slug = cand["slug"]
        candidate_lookup[slug] = cand
        cand_text = candidate_text(cand)
        cand_profile = parse_resume_profile(cand_text)
        if cand.get("matched"):
            cand_profile["skills"] = sorted(list(set(cand_profile["skills"] + cand["matched"])))

        vec_score = vector_scores.get(slug, -1.0)
        matching = match_candidate_to_job(
            candidate_id=slug,
            job_id=job["slug"],
            candidate_profile=cand_profile,
            job_profile=job_profile,
            candidate_raw_text=cand_text,
            job_raw_text=job_text(job),
            semantic_score_override=vec_score,
        )

        llm_eval = await screen_candidate_llm(
            matching_result=matching,
            candidate_profile=cand_profile,
            job_profile=job_profile,
            candidate_raw_text=cand_text,
            candidate_name=cand.get("name"),
        )

        now = datetime.now(timezone.utc)
        record = {
            "screening_id": f"scr-{uuid.uuid4().hex[:8]}",
            "candidate_id": slug,
            "job_id": job["slug"],
            "screening_version": SCREENING_VERSION,
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

        # Persist versioned result in MongoDB
        await db.screening_results.update_one(
            {"candidate_id": slug, "job_id": job["slug"]},
            {"$set": record},
            upsert=True,
        )

        # Update candidate doc
        await db.candidates.update_one(
            {"slug": slug},
            {
                "$set": {
                    "match": matching["overall_score"],
                    "resume_score": llm_eval["score"],
                    "matched": matching["matched_skills"],
                    "missing": matching["missing_skills"],
                    "summary": llm_eval["reasoning"],
                }
            },
        )

        screened_items.append({
            "candidate_id": slug,
            "score": llm_eval["score"],
            "overall_score": matching["overall_score"],
            "skill_score": matching["skill_score"],
            "experience_score": matching["experience_score"],
            "matched_skills": matching["matched_skills"],
            "missing_skills": matching["missing_skills"],
            "recommendation": llm_eval["recommendation"],
        })

    # Run Evalix deterministic ranker
    ranked = rank_screened_candidates(job_id=job["slug"], screened_items=screened_items)

    # Format 'results' array for the existing frontend ScreenModal
    results_for_frontend: List[Dict[str, Any]] = []
    for cand_ranked in ranked["candidates"][:limit]:
        cid = cand_ranked["candidate_id"]
        cand_doc = candidate_lookup.get(cid)
        if cand_doc:
            results_for_frontend.append({
                "id": cid,
                "name": cand_doc.get("name"),
                "role": cand_doc.get("role"),
                "stage": (cand_doc.get("stage") or "SCREENING").lower(),
                "match": cand_ranked["score"],
                "score": cand_ranked["score"],
            })

    return {
        "job": job.get("slug"),
        "job_id": job.get("slug"),
        "engine": f"evalix+{engine}",
        "candidates": ranked["candidates"][:limit],
        "results": results_for_frontend,
    }
