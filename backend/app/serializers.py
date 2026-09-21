"""Serializers: MongoDB documents -> the exact camelCase JSON shapes the
frontend dashboard consumes (mirrors the reference TS implementation)."""

import re
from typing import Any, Dict, List, Optional

# Avatar chip palettes (index-stable with the frontend design system).
AVATAR_TONES: List[str] = [
    "bg-[#dde0b8] text-[#454e1e]",
    "bg-[#e8dfc9] text-[#6b5d21]",
    "bg-[#dfe3e0] text-[#3d4a42]",
    "bg-[#efe0d4] text-[#7a4b32]",
    "bg-[#e4dcec] text-[#544468]",
    "bg-[#f0e0e0] text-[#8a4444]",
]


def initials_of(name: str) -> str:
    return "".join(p[0] for p in name.split()[:2]).upper()


def tone_for(slug: str, name: str) -> str:
    numeric = re.search(r"\d+", slug)
    if numeric:
        # Seeded candidates (c1, c2, …) keep their original tone by index.
        return AVATAR_TONES[(int(numeric.group(0)) - 1) % len(AVATAR_TONES)]
    h = 0
    for ch in name:
        h = (h * 31 + ord(ch)) % 997
    return AVATAR_TONES[h % len(AVATAR_TONES)]


def ago_from_minutes(minutes: int) -> str:
    if minutes >= 1440:
        return f"{minutes // 1440}d ago"
    if minutes >= 60:
        return f"{max(1, minutes // 60)}h ago"
    return f"{max(1, int(minutes))}m ago"


def serialize_candidate(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": row.get("slug"),
        "name": row.get("name"),
        "email": row.get("email"),
        "role": row.get("role"),
        "jobId": row.get("job_id"),
        "location": row.get("location"),
        "initials": initials_of(row.get("name", "")),
        "avatarClass": tone_for(row.get("slug", ""), row.get("name", "")),
        "appliedDays": row["applied_days_ago"],
        "appliedAt": f"{row['applied_days_ago']}d ago",
        "updated": ago_from_minutes(row["updated_minutes_ago"]),
        "stage": row["stage"].lower(),
        "match": row["match"],
        "scores": {
            "resume": row["resume_score"],
            "assessment": row["assessment_score"],
            "interview": row["interview_score"],
            "task": row["task_score"],
        },
        "source": row["source"],
        "shortlisted": bool(row["shortlisted"]),
        "summary": row["summary"],
        "matched": row["matched"],
        "missing": row["missing"],
        "assessmentSections": row["assessment_sections"],
        "interview": row.get("interview"),
        "task": row.get("task"),
    }


def serialize_job(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": row.get("slug"),
        "title": row.get("title"),
        "dept": row.get("dept"),
        "location": row.get("location"),
        "type": row["employment_type"],
        "status": row["status"].lower(),
        "posted": f"{row['posted_days_ago']}d ago",
        "pipeline": row["pipeline"],
    }
