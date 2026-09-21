"""Dashboard statistics builder + Redis cache (30s TTL, invalidated on writes).

All numbers are computed live from MongoDB; the editorial insight sentences
live in the `insights` collection (seeded) so no dashboard copy is
hard-coded in application code.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from redis.asyncio import Redis


log = logging.getLogger("evalix.stats")

CACHE_KEY = "cache:stats"
CACHE_TTL = 30


async def invalidate_stats_cache(redis: Optional[Redis]) -> None:
    if redis is None:
        return
    try:
        await redis.delete(CACHE_KEY)
    except Exception:
        pass


async def get_stats(
    db: AsyncIOMotorDatabase, redis: Optional[Redis], force: bool = False
) -> Dict[str, Any]:
    if not force and redis is not None:
        try:
            cached = await redis.get(CACHE_KEY)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

    jobs = [d async for d in db.jobs.find({})]
    total_candidates = await db.candidates.count_documents({})
    avg_match = await _avg(db.candidates, "match")
    avg_assessment = await _avg(db.candidates, "assessment_score")
    hired_count = await db.candidates.count_documents({"stage": "HIRED"})
    weeks = [w async for w in db.metric_weekly.find({}).sort("week_index", 1)]
    top_matches = await db.candidates.count_documents({"match": {"$gte": 90}})
    stale = await db.candidates.count_documents(
        {"match": {"$gte": 90}, "updated_minutes_ago": {"$gte": 7200}}
    )

    active_jobs = sum(1 for j in jobs if j.get("status") == "OPEN")

    # Funnel = sums of every job's pipeline (all applicants), hired live.
    sums = [0, 0, 0, 0, 0]
    for job in jobs:
        pipeline = job.get("pipeline") or []
        for i, n in enumerate(pipeline[:5]):
            sums[i] += n
    funnel = [
        {"label": "Applied", "value": sums[0]},
        {"label": "AI-screened", "value": sums[1]},
        {"label": "Assessed", "value": sums[2]},
        {"label": "Interviewed", "value": sums[3]},
        {"label": "Offers", "value": sums[4]},
        {"label": "Hired", "value": hired_count},
    ]

    # Insight copy comes from the DB (seeded); "{n}"/"{k}" are live numbers.
    insight_docs = [i async for i in db.insights.find({}).sort("order", 1)]
    insights = []
    for doc in insight_docs:
        text = doc["text"].format(n=top_matches, k=stale)
        insights.append({"tone": doc["tone"], "text": text})

    upcoming_rows = (
        db.candidates.find({"stage": "INTERVIEW", "interview": {"$ne": None}})
        .sort("match", -1)
        .limit(4)
    )
    upcoming = [
        {
            "id": c["slug"],
            "name": c["name"],
            "role": c["role"],
            "when": c["interview"]["when"],
            "readiness": c["match"],
        }
        async for c in upcoming_rows
    ]

    stats: Dict[str, Any] = {
        "kpis": {
            "activeJobs": active_jobs,
            "totalCandidates": total_candidates,
            "assessmentRate": round(avg_assessment),
            "avgMatch": round(avg_match),
        },
        "flow": {
            "labels": [w["week_label"] for w in weeks],
            "applied": [w["applied"] for w in weeks],
            "shortlisted": [w["shortlisted"] for w in weeks],
        },
        "funnel": funnel,
        "insights": insights,
        "upcoming": upcoming,
    }

    if redis is not None:
        try:
            await redis.set(CACHE_KEY, json.dumps(stats), ex=CACHE_TTL)
        except Exception:
            pass
    return stats


async def _avg(coll, field: str) -> float:
    rows = [d async for d in coll.aggregate(
        [{"$group": {"_id": None, "avg": {"$avg": f"${field}"}}}]
    )]
    return rows[0]["avg"] if rows and rows[0].get("avg") is not None else 0.0


async def generate_dynamic_insight(
    db: AsyncIOMotorDatabase, redis: Optional[Redis]
) -> Dict[str, Any]:
    """Generate a dynamic AI insight from real-time pipeline data and store it."""
    total = await db.candidates.count_documents({})
    screening = await db.candidates.count_documents({"stage": "SCREENING"})
    interview = await db.candidates.count_documents({"stage": "INTERVIEW"})
    top_matches = await db.candidates.count_documents({"match": {"$gte": 90}})
    hired = await db.candidates.count_documents({"stage": "HIRED"})

    tone = "olive" if top_matches > 0 else "ink"
    text = ""

    # Attempt dynamic market & pipeline synthesis via Gemini 3.5 Flash + DuckDuckGo search
    try:
        from app.core.ai_client import run_ai_with_search
        prompt = (
            f"EvalixAI Pipeline Metrics:\n"
            f"- Total candidates: {total}\n"
            f"- In screening: {screening}\n"
            f"- In AI & Technical Interviews: {interview}\n"
            f"- Top candidates (90%+ match): {top_matches}\n"
            f"- Hired: {hired}\n\n"
            f"Synthesize this with recent tech hiring and recruitment trends in a single, crisp, impactful recruiter sentence (max 22 words)."
        )
        ai_insight = run_ai_with_search(
            user_prompt=prompt,
            search_query="tech talent hiring recruitment trends 2026",
            system_instruction="You are a data-driven recruitment intelligence director. Output ONLY the insight sentence without quotes.",
            model="google/gemini-3.5-flash",
        )
        if ai_insight and len(ai_insight.strip()) > 15:
            text = ai_insight.strip().strip('"').strip("'")
            tone = "olive" if top_matches >= 2 else ("amber" if screening > 3 else "ink")
    except Exception as exc:
        log.warning("Gemini insight generation failed: %s — falling back to rule-based insight", exc)

    if not text:
        # Dynamic tone and text based on live numbers
        if top_matches > 3:
            tone = "olive"
            text = f"High pipeline quality: {top_matches} candidates meet the 90%+ match threshold across active roles."
        elif interview > 2:
            tone = "ink"
            text = f"Interview volume is high: {interview} candidates currently scheduled for AI & technical rounds."
        elif screening > 5:
            tone = "amber"
            text = f"{screening} applicants in early screening — automated scoring is running in the background."
        else:
            tone = "olive"
            text = f"Pipeline balanced: {total} total candidates tracked, {hired} successfully hired to date."

    # Save to db so it persists
    await db.insights.update_one({"tone": tone}, {"$set": {"text": text}}, upsert=True)
    await invalidate_stats_cache(redis)
    return {"tone": tone, "text": text}


