"""EvalixAI MongoDB seed — populates the demo dataset (jobs, candidates,
weekly metrics, dashboard insights, the demo recruiter account and Qdrant
candidate vectors).

The application itself contains NO embedded data: every number and sentence
rendered in the dashboard comes from MongoDB through the API. This script is
the single, explicit place where demo content enters the database — safe to
re-run (idempotent upserts by slug/email/week).

Usage:
    python -m scripts.seed            # from backend/ (or via npm run db:seed)
"""

import logging
import re
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

import bcrypt
import pymongo
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import get_settings  # noqa: E402
from app.services.screen_service import heuristic_embed, point_id  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
log = logging.getLogger("seed")

settings = get_settings()

DEMO_EMAIL = "demo@evalix.ai"
DEMO_PASSWORD = "Demo1234!"
DEMO_NAME = "Dana Kim"

STAGE_MAP = {
    "screening": "SCREENING",
    "assessment": "ASSESSMENT",
    "interview": "INTERVIEW",
    "offer": "OFFER",
    "hired": "HIRED",
    "rejected": "REJECTED",
}
STATUS_MAP = {"open": "OPEN", "paused": "PAUSED", "closed": "CLOSED"}


def parse_updated(value: str) -> int:
    """'2h ago' -> 120, '3d ago' -> 4320."""
    m = re.match(r"(\d+)\s*([hd])", value.strip())
    if not m:
        return 90
    n, unit = int(m.group(1)), m.group(2)
    return n * 60 if unit == "h" else n * 1440


# ------------------------------ dataset ------------------------------

JOBS = [
    {"id": "fe", "title": "Senior Frontend Engineer", "dept": "Engineering", "location": "Remote · EU/US", "type": "Full-time", "status": "open", "posted": "21d ago", "pipeline": [142, 96, 44, 12, 6]},
    {"id": "ml", "title": "ML Engineer", "dept": "AI Research", "location": "San Francisco · Hybrid", "type": "Full-time", "status": "open", "posted": "18d ago", "pipeline": [98, 62, 28, 6, 3]},
    {"id": "be", "title": "Backend Engineer (Go)", "dept": "Platform", "location": "Berlin · Remote", "type": "Full-time", "status": "open", "posted": "14d ago", "pipeline": [74, 41, 15, 3, 1]},
    {"id": "pd", "title": "Product Designer", "dept": "Design", "location": "Remote", "type": "Contract", "status": "open", "posted": "9d ago", "pipeline": [38, 22, 11, 3, 1]},
    {"id": "da", "title": "Data Analyst", "dept": "Growth", "location": "London · Hybrid", "type": "Full-time", "status": "paused", "posted": "27d ago", "pipeline": [52, 21, 7, 1, 0]},
    {"id": "ops", "title": "DevOps Engineer", "dept": "Platform", "location": "Remote", "type": "Full-time", "status": "open", "posted": "5d ago", "pipeline": [31, 12, 3, 0, 0]},
]

CANDIDATES = [
    {
        "id": "c1", "name": "Aisha Khan", "email": "aisha.khan@mail.com", "role": "Senior Frontend Engineer",
        "jobId": "fe", "location": "Remote · Berlin", "appliedDays": 6, "updated": "2h ago", "stage": "interview",
        "match": 94, "scores": {"resume": 96, "assessment": 91, "interview": 92, "task": 88},
        "source": "Careers page", "shortlisted": True,
        "summary": "Senior frontend engineer with 7 years building design systems at two Series-B startups. Shipped a component library adopted by 40+ engineers with strong React and TypeScript depth. Led an accessibility overhaul that cut UI-related support tickets by 18%.",
        "matched": ["React 18", "TypeScript", "Design systems", "Playwright", "Accessibility"],
        "missing": ["GraphQL", "i18n at scale"],
        "assessmentSections": [{"label": "React & TypeScript", "score": 92}, {"label": "System design", "score": 78}, {"label": "UI craft & a11y", "score": 90}],
        "interview": {
            "when": "Sep 12 · AI interview", "minutes": 34, "verdict": "Strong hire",
            "strengths": ["Explains rendering-performance trade-offs from first principles", "Concrete ownership stories with measurable outcomes", "Clear, structured communication throughout"],
            "improvements": ["Asked fewer clarifying questions on the metrics exercise", "Could deepen testing strategy beyond happy paths"],
            "quote": "At Meshflow I owned the migration of 200+ components to a typed design system — we cut UI regressions by 40% in two quarters.",
        },
        "task": {"title": "Build an accessible autocomplete widget", "passed": 8, "total": 9, "quality": 88, "minutes": 47, "note": "Clean composition, keyboard support handled well; one edge case missed on IME composition input."},
    },
    {
        "id": "c2", "name": "Marcus Chen", "email": "marcus.chen@mail.com", "role": "Senior Frontend Engineer",
        "jobId": "fe", "location": "San Francisco", "appliedDays": 4, "updated": "5h ago", "stage": "interview",
        "match": 92, "scores": {"resume": 94, "assessment": 89, "interview": 93, "task": 84},
        "source": "Referral", "shortlisted": True,
        "summary": "Ex-staff engineer at a fintech scale-up; led the move to micro-frontends across 5 product squads. Pragmatic about trade-offs and unusually good at writing design docs that others actually read.",
        "matched": ["React", "TypeScript", "Micro-frontends", "CI/CD"],
        "missing": ["Design systems", "Testing depth"],
        "assessmentSections": [{"label": "React & TypeScript", "score": 89}, {"label": "System design", "score": 91}, {"label": "UI craft & a11y", "score": 82}],
        "interview": {
            "when": "Sep 11 · AI interview", "minutes": 31, "verdict": "Strong hire",
            "strengths": ["Systems thinking — frames problems at the right altitude", "Calm and precise under follow-up questioning"],
            "improvements": ["Could say more about mentoring junior engineers"],
            "quote": "I treat design docs as the product — if a new hire can't ship from my doc, it's not done.",
        },
        "task": {"title": "Debounce + cache layer for a search API", "passed": 9, "total": 9, "quality": 91, "minutes": 52, "note": "Solid tests; added an LRU bound without being asked. Excellent error handling."},
    },
    {
        "id": "c3", "name": "Priya Patel", "email": "priya.patel@mail.com", "role": "ML Engineer",
        "jobId": "ml", "location": "Remote · Austin", "appliedDays": 9, "updated": "1d ago", "stage": "assessment",
        "match": 88, "scores": {"resume": 90, "assessment": 86, "interview": 0, "task": 0},
        "source": "LinkedIn", "shortlisted": False,
        "summary": "ML engineer with a publications streak in retrieval (RecSys '24). Ran end-to-end evaluations for a RAG support bot serving 40k daily queries and knows how to defend a metric in front of stakeholders.",
        "matched": ["Python", "RAG evaluation", "Embeddings", "LLM fine-tuning"],
        "missing": ["Kubernetes", "Go"],
        "assessmentSections": [{"label": "ML fundamentals", "score": 90}, {"label": "RAG & evaluation", "score": 93}, {"label": "Coding", "score": 79}],
    },
    {
        "id": "c4", "name": "Sofia Ramirez", "email": "sofia.ramirez@mail.com", "role": "ML Engineer",
        "jobId": "ml", "location": "Remote · Madrid", "appliedDays": 11, "updated": "3h ago", "stage": "interview",
        "match": 87, "scores": {"resume": 86, "assessment": 84, "interview": 90, "task": 82},
        "source": "Careers page", "shortlisted": False,
        "summary": "Research-minded engineer moving toward product work. Built an active-learning pipeline that halved labeling costs for a document-intelligence product. Strong experiment hygiene.",
        "matched": ["Python", "PyTorch", "Active learning", "MLOps"],
        "missing": ["Rust", "On-call experience"],
        "assessmentSections": [{"label": "ML fundamentals", "score": 86}, {"label": "RAG & evaluation", "score": 83}, {"label": "Coding", "score": 84}],
        "interview": {
            "when": "Sep 10 · AI interview", "minutes": 29, "verdict": "Strong hire",
            "strengths": ["Every claim came with a rollback plan — rare experiment discipline", "Honest about failure modes of her own models"],
            "improvements": ["Could engage more on cost/latency constraints"],
            "quote": "I don't ship a model without a kill switch and a shadow evaluation first.",
        },
        "task": {"title": "Build an eval harness for a support chatbot", "passed": 7, "total": 9, "quality": 82, "minutes": 61, "note": "Good structure and golden-set thinking; two metrics were underspecified."},
    },
    {
        "id": "c5", "name": "David Okafor", "email": "david.okafor@mail.com", "role": "Product Designer",
        "jobId": "pd", "location": "Remote · Lagos", "appliedDays": 8, "updated": "4h ago", "stage": "interview",
        "match": 78, "scores": {"resume": 82, "assessment": 74, "interview": 79, "task": 85},
        "source": "Dribbble", "shortlisted": False,
        "summary": "Product designer who codes — prototypes in React and ships his own design tokens. Portfolio shows measurable outcomes rather than concept shots: one redesign lifted activation 22%.",
        "matched": ["Figma", "Design tokens", "Prototyping", "HTML/CSS"],
        "missing": ["User research", "B2B experience"],
        "assessmentSections": [{"label": "Visual craft", "score": 88}, {"label": "Product thinking", "score": 71}, {"label": "Handoff fluency", "score": 82}],
        "interview": {
            "when": "Sep 13 · AI interview", "minutes": 27, "verdict": "Lean hire",
            "strengths": ["Presents rationale as decisions, not decoration", "Codes what he designs"],
            "improvements": ["Weaker on research methods — probe in panel round", "Little exposure to enterprise workflows"],
            "quote": "A design that engineering has to translate isn't finished — I ship the translation myself.",
        },
        "task": {"title": "Redesign a scheduling flow — Figma + written rationale", "passed": 5, "total": 5, "quality": 85, "minutes": 74, "note": "Strong rationale doc; considered edge cases like timezones and recurring edits."},
    },
    {
        "id": "c6", "name": "Emily Nakamura", "email": "emily.nakamura@mail.com", "role": "Backend Engineer (Go)",
        "jobId": "be", "location": "Tokyo", "appliedDays": 13, "updated": "6h ago", "stage": "interview",
        "match": 84, "scores": {"resume": 84, "assessment": 82, "interview": 86, "task": 83},
        "source": "Referral", "shortlisted": False,
        "summary": "Backend engineer from an infrastructure team who owns the boring-but-critical parts: idempotency, retries, observability. Wrote the internal Go style guide adopted by 30 engineers.",
        "matched": ["Go", "PostgreSQL", "gRPC", "Observability"],
        "missing": ["Kafka", "Terraform"],
        "assessmentSections": [{"label": "Go & concurrency", "score": 85}, {"label": "Data modeling", "score": 80}, {"label": "Ops & reliability", "score": 87}],
        "interview": {
            "when": "Sep 12 · AI interview", "minutes": 33, "verdict": "Strong hire",
            "strengths": ["Deep idempotency knowledge from payments work", "Writes for the on-call engineer"],
            "improvements": ["Limited experience with event-driven architectures"],
            "quote": "Every endpoint I own has a runbook. If 3 a.m. me can't follow it, neither can the next person.",
        },
        "task": {"title": "Rate limiter with sliding window", "passed": 9, "total": 10, "quality": 83, "minutes": 58, "note": "Correct under concurrency; one fairness edge case missed. Clean abstractions."},
    },
    {
        "id": "c7", "name": "James Whitfield", "email": "james.whitfield@mail.com", "role": "Backend Engineer (Go)",
        "jobId": "be", "location": "London", "appliedDays": 16, "updated": "1d ago", "stage": "offer",
        "match": 91, "scores": {"resume": 90, "assessment": 88, "interview": 94, "task": 92},
        "source": "LinkedIn", "shortlisted": True,
        "summary": "Distributed-systems engineer who scaled a payments ledger to 4k TPS. Communicates trade-offs with diagrams; the interview panel scored him in the top 5% of this year's loop.",
        "matched": ["Go", "Distributed systems", "Kafka", "Kubernetes"],
        "missing": ["Frontend empathy"],
        "assessmentSections": [{"label": "Go & concurrency", "score": 93}, {"label": "Data modeling", "score": 87}, {"label": "Ops & reliability", "score": 90}],
        "interview": {
            "when": "Sep 8 · AI interview", "minutes": 36, "verdict": "Exceptional",
            "strengths": ["Best whiteboard narrative of the cohort — diagrams first", "Back-of-envelope estimates landed within 15% of measured numbers"],
            "improvements": ["None flagged by the AI interviewer"],
            "quote": "Consistency is a product feature. We designed the ledger so replay is boring — boring is good.",
        },
        "task": {"title": "Deduplicating event consumer", "passed": 11, "total": 11, "quality": 94, "minutes": 63, "note": "Textbook solution with property-based tests. Flagged a spec ambiguity unprompted."},
    },
    {
        "id": "c8", "name": "Léa Dubois", "email": "lea.dubois@mail.com", "role": "Data Analyst",
        "jobId": "da", "location": "Remote · Paris", "appliedDays": 10, "updated": "2d ago", "stage": "assessment",
        "match": 76, "scores": {"resume": 78, "assessment": 75, "interview": 0, "task": 0},
        "source": "Careers page", "shortlisted": False,
        "summary": "Analytics engineer with a marketing-analytics bent; built the attribution model that shifted 15% of spend at her last company. Strong SQL, growing Python — dbt power user.",
        "matched": ["SQL", "dbt", "Looker", "Attribution modeling"],
        "missing": ["Python", "Experiment design"],
        "assessmentSections": [{"label": "SQL", "score": 84}, {"label": "Analytics craft", "score": 76}, {"label": "Storytelling", "score": 88}],
    },
    {
        "id": "c9", "name": "Tomasz Nowak", "email": "tomasz.nowak@mail.com", "role": "Data Analyst",
        "jobId": "da", "location": "Kraków", "appliedDays": 3, "updated": "3d ago", "stage": "screening",
        "match": 64, "scores": {"resume": 66, "assessment": 0, "interview": 0, "task": 0},
        "source": "Indeed", "shortlisted": False,
        "summary": "Solid generalist background with consulting exposure; resume is light on measurable impact. Worth one screening call before deciding — the AI screen found promising signals in his warehouse project.",
        "matched": ["SQL", "Excel", "Power BI"],
        "missing": ["Python", "dbt", "Experiment design"],
        "assessmentSections": [{"label": "AI resume screen", "score": 66}],
    },
    {
        "id": "c10", "name": "Hana Yamamoto", "email": "hana.yamamoto@mail.com", "role": "Product Designer",
        "jobId": "pd", "location": "Remote · Osaka", "appliedDays": 2, "updated": "2d ago", "stage": "screening",
        "match": 71, "scores": {"resume": 73, "assessment": 0, "interview": 0, "task": 0},
        "source": "Dribbble", "shortlisted": False,
        "summary": "Visual-first portfolio with strong brand and motion work; product thinking is less evident. The AI screen recommends probing case-study depth in a first call before advancing.",
        "matched": ["Figma", "Motion design", "Brand systems"],
        "missing": ["Product thinking", "Design systems", "Prototyping"],
        "assessmentSections": [{"label": "AI resume screen", "score": 73}],
    },
    {
        "id": "c11", "name": "Rahul Mehta", "email": "rahul.mehta@mail.com", "role": "Senior Frontend Engineer",
        "jobId": "fe", "location": "Remote · Bengaluru", "appliedDays": 24, "updated": "3d ago", "stage": "hired",
        "match": 96, "scores": {"resume": 96, "assessment": 95, "interview": 97, "task": 93},
        "source": "Referral", "shortlisted": True,
        "summary": "Accepted — starts Oct 6. Fastest pipeline of the cohort: applied to offer in 11 days. Previously led performance at a commerce scale-up (2s → 800ms LCP across 30 storefronts).",
        "matched": ["React", "TypeScript", "Performance", "Design systems", "Testing"],
        "missing": [],
        "assessmentSections": [{"label": "React & TypeScript", "score": 95}, {"label": "System design", "score": 88}, {"label": "UI craft & a11y", "score": 94}],
        "interview": {
            "when": "Sep 2 · AI interview", "minutes": 38, "verdict": "Exceptional",
            "strengths": ["Performance work backed by real numbers", "Mentorship instincts"],
            "improvements": [],
            "quote": "Every millisecond I removed was tied to a revenue number. I keep a spreadsheet to prove it.",
        },
        "task": {"title": "Virtualized table with keyboard navigation", "passed": 10, "total": 10, "quality": 93, "minutes": 55, "note": "Flawless. Screen-reader support unprompted — clearly lives the a11y story."},
    },
    {
        "id": "c12", "name": "Grace Adeyemi", "email": "grace.adeyemi@mail.com", "role": "ML Engineer",
        "jobId": "ml", "location": "Remote · Toronto", "appliedDays": 18, "updated": "1d ago", "stage": "offer",
        "match": 89, "scores": {"resume": 88, "assessment": 87, "interview": 90, "task": 88},
        "source": "LinkedIn", "shortlisted": True,
        "summary": "Ex-research engineer moving to product; shipped an internal fine-tuning platform used by 60 developers. Negotiating start date — needs visa sponsorship confirmed first.",
        "matched": ["Python", "PyTorch", "Fine-tuning platforms", "Eval pipelines"],
        "missing": ["Kubernetes"],
        "assessmentSections": [{"label": "ML fundamentals", "score": 87}, {"label": "RAG & evaluation", "score": 86}, {"label": "Coding", "score": 88}],
        "interview": {
            "when": "Sep 6 · AI interview", "minutes": 32, "verdict": "Strong hire",
            "strengths": ["Bridges research and product naturally", "Pragmatic about model costs"],
            "improvements": ["Sponsorship logistics need early attention"],
            "quote": "Researchers ship papers; product engineers ship habits. I built the platform so fine-tuning becomes a habit.",
        },
        "task": {"title": "Batch inference service with cost cap", "passed": 9, "total": 9, "quality": 88, "minutes": 49, "note": "Cost-aware design, retries and caching considered. Good docstrings."},
    },
    {
        "id": "c13", "name": "Nikolai Petrov", "email": "nikolai.petrov@mail.com", "role": "Backend Engineer (Go)",
        "jobId": "be", "location": "Remote · Sofia", "appliedDays": 12, "updated": "5d ago", "stage": "rejected",
        "match": 58, "scores": {"resume": 72, "assessment": 48, "interview": 52, "task": 41},
        "source": "Indeed", "shortlisted": False,
        "summary": "Strong CV on paper — payments domain experience matches. However, the sandbox told a different story: failed the Go concurrency task twice with brittle channel patterns.",
        "matched": ["Go", "Payments domain", "PostgreSQL"],
        "missing": ["Concurrency patterns", "Testing", "Observability"],
        "assessmentSections": [{"label": "Go & concurrency", "score": 51}, {"label": "Data modeling", "score": 62}, {"label": "Ops & reliability", "score": 44}],
        "interview": {
            "when": "Sep 5 · AI interview", "minutes": 24, "verdict": "No hire",
            "strengths": ["Domain knowledge of payment flows"],
            "improvements": ["Concurrency reasoning", "Test discipline"],
            "quote": "I mostly copy the retry pattern from our internal library.",
        },
        "task": {"title": "Rate limiter with sliding window", "passed": 4, "total": 10, "quality": 41, "minutes": 74, "note": "Race conditions under load; timed out without submitting tests."},
    },
    {
        "id": "c14", "name": "Olivia Bennett", "email": "olivia.bennett@mail.com", "role": "Data Analyst",
        "jobId": "da", "location": "Manchester", "appliedDays": 15, "updated": "7d ago", "stage": "rejected",
        "match": 62, "scores": {"resume": 74, "assessment": 45, "interview": 58, "task": 41},
        "source": "Careers page", "shortlisted": False,
        "summary": "Great storytelling and stakeholder presence — the AI interviewer praised her communication. SQL sandbox score landed below the bar (41/100) for the seniority this role requires.",
        "matched": ["Storytelling", "Looker", "Stakeholder mgmt"],
        "missing": ["SQL depth", "dbt", "Experiment design"],
        "assessmentSections": [{"label": "SQL", "score": 48}, {"label": "Analytics craft", "score": 60}, {"label": "Storytelling", "score": 82}],
        "interview": {
            "when": "Sep 4 · AI interview", "minutes": 26, "verdict": "No hire",
            "strengths": ["Excellent communication", "Executive presence"],
            "improvements": ["SQL depth for senior analytics work"],
            "quote": "I'd rather tell the story right than get the query exactly right.",
        },
        "task": {"title": "Funnel drop-off analysis in SQL", "passed": 3, "total": 8, "quality": 41, "minutes": 69, "note": "Window functions misused; final answers not validated against the dataset."},
    },
]

FLOW_SERIES = {
    "labels": ["Jul 28", "Aug 4", "Aug 11", "Aug 18", "Aug 25", "Sep 1", "Sep 8", "Sep 15"],
    "applied": [212, 248, 235, 290, 312, 296, 348, 372],
    "shortlisted": [78, 92, 88, 112, 124, 118, 141, 152],
}

# {n} and {k} are replaced with live numbers by the stats endpoint.
INSIGHTS = [
    {"tone": "olive", "text": "{n} candidates above 90% match — {k} haven't been updated in 5+ days."},
    {"tone": "amber", "text": "Assessment completion dipped 8% this week. The React section may be too long — consider trimming to 12 questions."},
    {"tone": "ink", "text": "Roles with the SQL sandbox task are closing 2.3× faster than those without. Worth adding to the Data Analyst role."},
]


def candidate_text(c: dict) -> str:
    return " ".join([c["role"], c["name"], *c["matched"], *c["missing"], c["summary"]])


def main() -> None:
    client = pymongo.MongoClient(
        settings.mongodb_url, serverSelectionTimeoutMS=settings.mongodb_timeout_ms
    )
    db = client[settings.mongodb_db_name]
    now = datetime.now(timezone.utc)

    # ---------------- users ----------------
    demo = db.users.find_one({"email": DEMO_EMAIL})
    if demo:
        demo_id = demo["id"]
        log.info("demo user exists — keeping the existing password")
    else:
        demo_id = uuid.uuid4().hex
        db.users.insert_one(
            {
                "id": demo_id,
                "email": DEMO_EMAIL,
                "name": DEMO_NAME,
                "password_hash": bcrypt.hashpw(
                    DEMO_PASSWORD.encode(), bcrypt.gensalt(rounds=settings.bcrypt_rounds)
                ).decode(),
                "role": "RECRUITER",
                "failed_login_attempts": 0,
                "locked_until": None,
                "last_login_at": None,
                "created_at": now,
                "updated_at": now,
            }
        )
        log.info("created demo user %s", DEMO_EMAIL)

    # ---------------- jobs ----------------
    for j in JOBS:
        values = {
            "title": j["title"],
            "dept": j["dept"],
            "location": j["location"],
            "employment_type": j["type"],
            "status": STATUS_MAP.get(j["status"], "OPEN"),
            "posted_days_ago": int(j["posted"].split("d")[0] or 0),
            "pipeline": j["pipeline"],
            "updated_at": now,
        }
        db.jobs.update_one(
            {"slug": j["id"]},
            {"$set": values, "$setOnInsert": {"slug": j["id"], "created_by_id": demo_id, "created_at": now}},
            upsert=True,
        )

    # ---------------- candidates ----------------
    for c in CANDIDATES:
        values = {
            "name": c["name"],
            "email": c["email"],
            "role": c["role"],
            "job_id": c["jobId"],
            "location": c["location"],
            "applied_days_ago": c["appliedDays"],
            "updated_minutes_ago": parse_updated(c["updated"]),
            "stage": STAGE_MAP[c["stage"]],
            "previous_stage": None,
            "match": c["match"],
            "resume_score": c["scores"]["resume"],
            "assessment_score": c["scores"]["assessment"],
            "interview_score": c["scores"].get("interview") or None,
            "task_score": c["scores"].get("task") or None,
            "source": c["source"],
            "shortlisted": c["shortlisted"],
            "summary": c["summary"],
            "matched": c["matched"],
            "missing": c["missing"],
            "assessment_sections": c["assessmentSections"],
            "interview": c.get("interview"),
            "task": c.get("task"),
            "updated_at": now,
        }
        db.candidates.update_one(
            {"slug": c["id"]},
            {"$set": values, "$setOnInsert": {"slug": c["id"], "created_at": now}},
            upsert=True,
        )

    # ---------------- weekly metrics ----------------
    for i, label in enumerate(FLOW_SERIES["labels"]):
        db.metric_weekly.update_one(
            {"week_label": label},
            {
                "$set": {
                    "week_index": i,
                    "applied": FLOW_SERIES["applied"][i],
                    "shortlisted": FLOW_SERIES["shortlisted"][i],
                }
            },
            upsert=True,
        )

    # ---------------- dashboard insights ----------------
    db.insights.delete_many({})
    db.insights.insert_many(
        [{"tone": i["tone"], "text": i["text"], "order": n} for n, i in enumerate(INSIGHTS)]
    )

    # ---------------- Qdrant vectors ----------------
    qdrant = None
    if settings.enable_vector_search:
        try:
            qdrant = QdrantClient(url=settings.qdrant_url, timeout=5,
                                  **({"api_key": settings.qdrant_api_key} if settings.qdrant_api_key else {}))
            if not qdrant.collection_exists(settings.qdrant_collection):
                qdrant.create_collection(
                    collection_name=settings.qdrant_collection,
                    vectors_config=qmodels.VectorParams(
                        size=settings.embedding_dim, distance=qmodels.Distance.COSINE
                    ),
                )
            qdrant.upsert(
                collection_name=settings.qdrant_collection,
                points=[
                    qmodels.PointStruct(
                        id=point_id(c["id"]),
                        vector=heuristic_embed(candidate_text(c), settings.embedding_dim),
                        payload={"slug": c["id"], "name": c["name"], "role": c["role"], "match": c["match"]},
                    )
                    for c in CANDIDATES
                ],
            )
            log.info("qdrant: upserted %d candidate vectors", len(CANDIDATES))
        except Exception as exc:
            log.warning("qdrant not reachable (%s) — vectors skipped; screening falls back to heuristic", exc)
            qdrant = None

    db.activity_log.insert_one(
        {
            "user_id": demo_id,
            "action": "seed",
            "detail": "Database seeded with demo dataset",
            "ip": None,
            "created_at": now,
        }
    )

    log.info(
        "done — %d users, %d jobs, %d candidates, %d weeks, %d insights",
        db.users.count_documents({}),
        db.jobs.count_documents({}),
        db.candidates.count_documents({}),
        db.metric_weekly.count_documents({}),
        db.insights.count_documents({}),
    )
    log.info("demo login: %s / %s", DEMO_EMAIL, DEMO_PASSWORD)
    client.close()


if __name__ == "__main__":
    main()
