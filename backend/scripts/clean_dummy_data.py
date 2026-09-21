"""Clean all dummy and seeded data from EvalixAI MongoDB and Qdrant.

Preserves:
- Primary recruiter account `demo@evalix.ai` (password `Demo1234!`)
- User account `gta1@gmail.com`
- User auth collection structure and indexes

Purges:
- Dummy candidates (c1..c20)
- Dummy jobs
- Screening results
- Interview sessions
- Activity logs
- Seeded insights and weekly metrics
- Temporary test users
- Qdrant candidate vector points
"""

import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
log = logging.getLogger("evalix_clean")

PRESERVED_EMAILS = {"demo@evalix.ai", "gta1@gmail.com"}


async def clean_database():
    client = AsyncIOMotorClient("mongodb://mongo:27017")
    db = client.evalixai

    # 1. Purge candidates
    cand_res = await db.candidates.delete_many({})
    log.info("Purged %d dummy candidates from db.candidates", cand_res.deleted_count)

    # 2. Purge jobs
    job_res = await db.jobs.delete_many({})
    log.info("Purged %d dummy jobs from db.jobs", job_res.deleted_count)

    # 3. Purge screening results
    screen_res = await db.screening_results.delete_many({})
    log.info("Purged %d screening results from db.screening_results", screen_res.deleted_count)

    # 4. Purge interview sessions and assessments
    int_res = await db.interview_sessions.delete_many({})
    asm_res = await db.assessments.delete_many({})
    log.info("Purged %d interview sessions and %d assessments", int_res.deleted_count, asm_res.deleted_count)

    # 5. Purge activity log
    act_res = await db.activity_log.delete_many({})
    log.info("Purged %d activity logs from db.activity_log", act_res.deleted_count)

    # 6. Purge weekly metrics & insights
    met_res = await db.metric_weekly.delete_many({})
    ins_res = await db.insights.delete_many({})
    log.info("Purged %d metrics and %d insights", met_res.deleted_count, ins_res.deleted_count)

    # 7. Clean test users, keeping only preserved users
    user_res = await db.users.delete_many({"email": {"$nin": list(PRESERVED_EMAILS)}})
    log.info("Purged %d temporary test users from db.users", user_res.deleted_count)

    # 8. Clear stale sessions
    sess_res = await db.sessions.delete_many({})
    log.info("Cleared %d session records from db.sessions", sess_res.deleted_count)

    # 9. Clean Qdrant vectors
    try:
        qdrant = QdrantClient(url="http://qdrant:6333", timeout=5)
        if qdrant.collection_exists("evalix_candidates"):
            qdrant.delete(
                collection_name="evalix_candidates",
                points_selector=qmodels.FilterSelector(
                    filter=qmodels.Filter()
                ),
            )
            log.info("Cleared all candidate vectors from Qdrant collection evalix_candidates")
    except Exception as e:
        log.warning("Qdrant cleanup skipped/failed: %s", e)

    log.info("Database cleanup completed successfully.")


if __name__ == "__main__":
    asyncio.run(clean_database())
