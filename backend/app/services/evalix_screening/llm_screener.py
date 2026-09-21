"""Evalix LLM Screening Service.

Generates structured candidate evaluations:
- recommendation ("strong_match", "good_match", "moderate_match", "low_match")
- score (0-100)
- reasoning (concise summary for recruiter)
- strengths (key highlights)
- concerns (potential risks)
- missing_requirements (missing core prerequisites)

Features:
- PII sanitization before sending to external LLMs.
- Offline deterministic evaluator stub when no external LLM API key is present.
"""

import json
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import get_settings
from app.services.evalix_screening.anonymizer import anonymize_candidate_text

log = logging.getLogger("evalix.screening.llm")
settings = get_settings()


def _offline_deterministic_screening(
    matching_result: Dict[str, Any],
    candidate_profile: Dict[str, Any],
    job_profile: Dict[str, Any],
) -> Dict[str, Any]:
    """Evalix offline deterministic screening evaluator."""
    overall = matching_result["overall_score"]
    matched = matching_result["matched_skills"]
    missing = matching_result["missing_skills"]
    gaps = matching_result["qualification_gaps"]
    years = candidate_profile.get("years_experience", 0)
    req_years = job_profile.get("min_experience_years", 0)

    if overall >= 86:
        recommendation = "strong_match"
    elif overall >= 74:
        recommendation = "good_match"
    elif overall >= 60:
        recommendation = "moderate_match"
    else:
        recommendation = "low_match"

    strengths: List[str] = []
    if matched:
        strengths.append(f"Demonstrates strong background in key skills: {', '.join(matched[:3])}")
    if years >= req_years and req_years > 0:
        strengths.append(f"Exceeds minimum experience requirement ({years} yrs vs {req_years} yrs required)")
    elif years > 0:
        strengths.append(f"Has {years} years of relevant industry experience")
    if matching_result["semantic_score"] >= 80:
        strengths.append("High semantic alignment with technical responsibilities")

    if not strengths:
        strengths.append("Meets basic baseline requirements for consideration")

    concerns: List[str] = []
    missing_reqs: List[str] = []

    if missing:
        top_missing = missing[:3]
        missing_reqs = top_missing
        concerns.append(f"Lacks demonstrated experience with required skills: {', '.join(top_missing)}")

    for gap in gaps:
        if gap not in concerns:
            concerns.append(gap)

    if not concerns:
        concerns.append("No critical technical red flags detected")

    if recommendation == "strong_match":
        reasoning = (
            f"Highly qualified candidate with {years} yrs experience and strong competency in "
            f"{', '.join(matched[:3]) if matched else 'core stack'}. Recommended to fast-track."
        )
    elif recommendation == "good_match":
        reasoning = (
            f"Solid technical fit possessing {len(matched)} matching competencies. "
            f"Recommend advancing to technical assessment."
        )
    elif recommendation == "moderate_match":
        reasoning = (
            f"Partial match with relevant foundations but notable skill gaps ({', '.join(missing[:2]) if missing else 'domain experience'}). "
            f"Follow-up screening recommended."
        )
    else:
        reasoning = (
            f"Candidate profile does not sufficiently meet role requirements. Significant gap in "
            f"{', '.join(missing[:2]) if missing else 'core competencies'}."
        )

    return {
        "recommendation": recommendation,
        "score": overall,
        "reasoning": reasoning,
        "strengths": strengths,
        "concerns": concerns,
        "missing_requirements": missing_reqs,
        "provider": "evalix-deterministic-offline",
    }


from app.core.ai_client import run_ai_completion


async def screen_candidate_llm(
    matching_result: Dict[str, Any],
    candidate_profile: Dict[str, Any],
    job_profile: Dict[str, Any],
    candidate_raw_text: str = "",
    candidate_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Run LLM screening for a candidate with deterministic fallback."""
    if settings.ai_provider == "kodekloud":
        try:
            sanitized_resume = anonymize_candidate_text(candidate_raw_text, candidate_name=candidate_name)

            prompt = (
                f"You are an expert technical talent screener. Evaluate the following candidate for the job.\n\n"
                f"Job Title: {job_profile.get('title')}\n"
                f"Department: {job_profile.get('dept')}\n"
                f"Required Skills: {', '.join(job_profile.get('required_skills', []))}\n"
                f"Preferred Skills: {', '.join(job_profile.get('preferred_skills', []))}\n"
                f"Min Experience: {job_profile.get('min_experience_years')} years\n\n"
                f"Candidate Summary:\n{sanitized_resume[:2500]}\n\n"
                f"Algorithmic Score: {matching_result['overall_score']}\n"
                f"Matched Skills: {', '.join(matching_result['matched_skills'])}\n"
                f"Missing Skills: {', '.join(matching_result['missing_skills'])}\n\n"
                f"Respond ONLY with a valid JSON object matching this schema:\n"
                f"{{\n"
                f'  "recommendation": "strong_match" | "good_match" | "moderate_match" | "low_match",\n'
                f'  "score": <number 0-100>,\n'
                f'  "reasoning": "<concise explanation without chain of thought>",\n'
                f'  "strengths": ["<strength 1>", "<strength 2>"],\n'
                f'  "concerns": ["<concern 1>"],\n'
                f'  "missing_requirements": ["<missing req 1>"]\n'
                f"}}"
            )

            raw_resp = run_ai_completion(
                messages=[{"role": "user", "content": prompt}],
                model="claude-sonnet-4-6",
                json_mode=False,
                temperature=0.2,
            )
            # Parse JSON safely even if wrapped in markdown blocks
            clean_json = raw_resp.strip()
            if clean_json.startswith("```"):
                lines = clean_json.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                clean_json = "\n".join(lines).strip()
            parsed = json.loads(clean_json)
            return {
                "recommendation": parsed.get("recommendation", "good_match"),
                "score": int(parsed.get("score", matching_result["overall_score"])),
                "reasoning": parsed.get("reasoning", ""),
                "strengths": parsed.get("strengths", []),
                "concerns": parsed.get("concerns", []),
                "missing_requirements": parsed.get("missing_requirements", []),
                "provider": "claude-sonnet-4-6",
            }
        except Exception as exc:
            log.warning("Claude screening failed (%s) — using deterministic fallback", exc)

    return _offline_deterministic_screening(matching_result, candidate_profile, job_profile)
