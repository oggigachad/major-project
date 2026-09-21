"""Evalix Candidate Ranking Algorithm.

Implements deterministic, multi-criteria candidate ranking for jobs:
- Rank 1..N
- Multi-criteria tie breaking:
    1. overall_score (descending)
    2. skill_score (descending)
    3. experience_score (descending)
    4. candidate_id (deterministic alphabetical tie-breaker)
"""

from typing import Any, Dict, List


def rank_screened_candidates(
    job_id: str,
    screened_items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Rank screened candidate results deterministically."""
    def sort_key(item: Dict[str, Any]):
        score = item.get("score") if item.get("score") is not None else item.get("overall_score", 0)
        skill = item.get("skill_score", 0)
        exp = item.get("experience_score", 0)
        cand_id = str(item.get("candidate_id", ""))
        return (-score, -skill, -exp, cand_id)

    sorted_items = sorted(screened_items, key=sort_key)

    ranked_candidates: List[Dict[str, Any]] = []
    for idx, item in enumerate(sorted_items, start=1):
        score = item.get("score") if item.get("score") is not None else item.get("overall_score", 0)
        entry = {
            "candidate_id": item.get("candidate_id"),
            "rank": idx,
            "score": score,
        }
        if "matched_skills" in item:
            entry["matched_skills"] = item["matched_skills"]
        if "missing_skills" in item:
            entry["missing_skills"] = item["missing_skills"]
        if "recommendation" in item:
            entry["recommendation"] = item["recommendation"]
        if "overall_score" in item and "score" not in entry:
            entry["overall_score"] = item["overall_score"]

        ranked_candidates.append(entry)

    return {
        "job_id": job_id,
        "candidates": ranked_candidates,
    }
