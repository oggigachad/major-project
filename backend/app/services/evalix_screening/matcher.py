"""Evalix Candidate ↔ Job Matching Pipeline.

Computes multi-dimensional match scores:
- Skill match (required + preferred overlap)
- Experience match (years vs requirement)
- Education match (degree vs requirement)
- Semantic similarity (lexical / vector embedding overlap)
- Qualification gap analysis
- Composite overall match score
"""

from typing import Any, Dict, List, Set


def calculate_skill_match(
    candidate_skills: List[str],
    required_skills: List[str],
    preferred_skills: List[str],
) -> Dict[str, Any]:
    """Calculate skill overlap scores and identify matched/missing skills."""
    cand_set = {s.lower() for s in candidate_skills}

    matched_required = [s for s in required_skills if s.lower() in cand_set]
    missing_required = [s for s in required_skills if s.lower() not in cand_set]

    matched_preferred = [s for s in preferred_skills if s.lower() in cand_set]
    missing_preferred = [s for s in preferred_skills if s.lower() not in cand_set]

    matched_all = matched_required + [s for s in matched_preferred if s not in matched_required]
    missing_all = missing_required + [s for s in missing_preferred if s not in missing_required]

    req_ratio = len(matched_required) / max(1, len(required_skills))
    pref_ratio = len(matched_preferred) / max(1, len(preferred_skills)) if preferred_skills else 1.0

    skill_score = round((0.75 * req_ratio + 0.25 * pref_ratio) * 100)
    skill_score = max(20, min(99, skill_score))

    return {
        "skill_score": skill_score,
        "matched_skills": matched_all,
        "missing_skills": missing_all,
        "matched_required": matched_required,
        "missing_required": missing_required,
        "matched_preferred": matched_preferred,
        "missing_preferred": missing_preferred,
        "required_ratio": round(req_ratio * 100),
        "preferred_ratio": round(pref_ratio * 100),
    }


def calculate_experience_match(
    candidate_years: float,
    required_years: float,
) -> Dict[str, Any]:
    """Score candidate years of experience against job requirements."""
    if required_years <= 0.0:
        return {"experience_score": 95, "gap": None}

    ratio = candidate_years / required_years

    if ratio >= 1.0:
        score = min(99, 85 + int(min(15, (ratio - 1.0) * 10)))
        gap = None
    elif ratio >= 0.75:
        score = 75
        gap = f"Experience ({candidate_years} yrs) slightly below requirement ({required_years} yrs)"
    elif ratio >= 0.5:
        score = 55
        gap = f"Experience ({candidate_years} yrs) below requirement ({required_years} yrs)"
    else:
        score = 35
        gap = f"Significant experience deficit ({candidate_years} yrs vs {required_years} yrs required)"

    return {
        "experience_score": score,
        "gap": gap,
    }


def calculate_education_match(
    candidate_edu_level: int,
    required_edu_level: int,
) -> Dict[str, Any]:
    """Score candidate education against required minimum education level."""
    if required_edu_level <= 0 or candidate_edu_level >= required_edu_level:
        return {"education_score": 95, "gap": None}

    diff = required_edu_level - candidate_edu_level
    if diff == 1:
        score = 75
        gap = "Education level slightly below target degree requirement"
    else:
        score = 50
        gap = "Education does not meet formal degree requirement"

    return {
        "education_score": score,
        "gap": gap,
    }


def calculate_semantic_similarity(
    candidate_text: str,
    job_text: str,
    precomputed_vector_score: float = -1.0,
) -> int:
    """Compute semantic overlap score between candidate profile and job posting."""
    if precomputed_vector_score >= 0.0:
        return max(30, min(99, round(precomputed_vector_score * 100)))

    cand_tokens = set(candidate_text.lower().split())
    job_tokens = set(job_text.lower().split()) - {"and", "the", "for", "with", "a", "in", "to", "of"}

    if not job_tokens:
        return 70

    overlap = len(cand_tokens & job_tokens)
    similarity = overlap / max(5, len(job_tokens))
    scaled = min(99, max(35, round(similarity * 120)))
    return scaled


def match_candidate_to_job(
    candidate_id: str,
    job_id: str,
    candidate_profile: Dict[str, Any],
    job_profile: Dict[str, Any],
    candidate_raw_text: str = "",
    job_raw_text: str = "",
    semantic_score_override: float = -1.0,
) -> Dict[str, Any]:
    """Run full Evalix candidate ↔ job matching algorithm."""
    cand_skills = candidate_profile.get("skills") or []
    req_skills = job_profile.get("required_skills") or []
    pref_skills = job_profile.get("preferred_skills") or []

    cand_years = float(candidate_profile.get("years_experience") or 0.0)
    req_years = float(job_profile.get("min_experience_years") or 0.0)

    cand_edu_level = candidate_profile.get("education", {}).get("level", 2)
    req_edu_level = job_profile.get("min_education_level", 2)

    # 1. Skill Match
    skill_res = calculate_skill_match(cand_skills, req_skills, pref_skills)

    # 2. Experience Match
    exp_res = calculate_experience_match(cand_years, req_years)

    # 3. Education Match
    edu_res = calculate_education_match(cand_edu_level, req_edu_level)

    # 4. Semantic Similarity
    semantic_score = calculate_semantic_similarity(
        candidate_raw_text or " ".join(cand_skills),
        job_raw_text or " ".join(req_skills + pref_skills),
        precomputed_vector_score=semantic_score_override,
    )

    # 5. Qualification Gaps Analysis
    qualification_gaps: List[str] = []
    if exp_res["gap"]:
        qualification_gaps.append(exp_res["gap"])
    if edu_res["gap"]:
        qualification_gaps.append(edu_res["gap"])
    for missing_crit in skill_res["missing_required"][:3]:
        qualification_gaps.append(f"Missing core required skill: {missing_crit}")

    # 6. Overall Composite Score
    overall = (
        0.40 * skill_res["skill_score"]
        + 0.25 * exp_res["experience_score"]
        + 0.15 * edu_res["education_score"]
        + 0.20 * semantic_score
    )
    overall_score = max(25, min(98, round(overall)))

    return {
        "candidate_id": candidate_id,
        "job_id": job_id,
        "overall_score": overall_score,
        "skill_score": skill_res["skill_score"],
        "experience_score": exp_res["experience_score"],
        "education_score": edu_res["education_score"],
        "semantic_score": semantic_score,
        "matched_skills": skill_res["matched_skills"],
        "missing_skills": skill_res["missing_skills"],
        "qualification_gaps": qualification_gaps,
        "required_match_pct": skill_res["required_ratio"],
        "preferred_match_pct": skill_res["preferred_ratio"],
    }
