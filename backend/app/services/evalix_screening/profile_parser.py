"""Evalix Profile Parser.

Extracts structured candidate profiles (skills, experience, education, seniority)
and structured job screening profiles (required/preferred skills, min experience, degrees).
"""

import re
from typing import Any, Dict, List, Optional, Set

# Comprehensive tech skill taxonomy
TECH_SKILLS = {
    # Programming Languages
    "Python", "JavaScript", "TypeScript", "Go", "Golang", "Rust", "Java", "C++", "C#", "Ruby",
    "PHP", "Swift", "Kotlin", "Scala", "SQL", "HTML", "CSS", "Bash", "Shell",
    # Frameworks & Libraries
    "React", "React.js", "Next.js", "Vue", "Vue.js", "Angular", "Svelte", "Node.js", "Express",
    "FastAPI", "Django", "Flask", "Spring Boot", "ASP.NET", "Rails", "Ruby on Rails",
    "Tailwind CSS", "Bootstrap", "Redux", "GraphQL", "REST", "RESTful APIs", "gRPC", "WebSocket",
    # Databases & Caching
    "PostgreSQL", "Postgres", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra",
    "DynamoDB", "SQLite", "Qdrant", "Chroma", "Pinecone", "Milvus", "Neo4j",
    # Cloud & DevOps
    "AWS", "Amazon Web Services", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "K8s",
    "Terraform", "Ansible", "CI/CD", "GitHub Actions", "GitLab CI", "Jenkins", "Linux",
    "Prometheus", "Grafana", "Datadog", "Nginx", "Serverless", "Microservices",
    # AI / ML
    "Machine Learning", "Deep Learning", "NLP", "LLMs", "LangChain", "LlamaIndex",
    "PyTorch", "TensorFlow", "scikit-learn", "Computer Vision", "Hugging Face", "Vector Search",
    # Methodologies & Soft Skills
    "System Design", "Agile", "Scrum", "TDD", "Unit Testing", "Integration Testing",
    "Code Review", "Mentorship", "Problem Solving", "Distributed Systems", "Git"
}

DEGREE_LEVELS = {
    "phd": 4,
    "doctorate": 4,
    "master": 3,
    "masters": 3,
    "ms": 3,
    "msc": 3,
    "mba": 3,
    "bachelor": 2,
    "bachelors": 2,
    "bs": 2,
    "bsc": 2,
    "ba": 2,
    "b.tech": 2,
    "b.e.": 2,
    "associate": 1,
    "diploma": 1,
    "high school": 0,
}


def _normalize_skill(skill: str) -> str:
    s = skill.strip()
    mapping = {
        "golang": "Go",
        "react.js": "React",
        "vue.js": "Vue",
        "postgres": "PostgreSQL",
        "amazon web services": "AWS",
        "google cloud": "GCP",
        "k8s": "Kubernetes",
        "ruby on rails": "Rails",
        "restful apis": "REST",
    }
    return mapping.get(s.lower(), s)


def extract_skills_from_text(text: str) -> List[str]:
    """Extract recognized technical skills from raw resume or job text."""
    found: Set[str] = set()
    text_lower = f" {text.lower()} "

    for skill in TECH_SKILLS:
        skill_clean = skill.lower()
        pattern = rf"(?<![a-zA-Z0-9_#+]){re.escape(skill_clean)}(?![a-zA-Z0-9_#+])"
        if re.search(pattern, text_lower):
            found.add(_normalize_skill(skill))

    return sorted(list(found))


def extract_years_of_experience(text: str) -> float:
    """Extract estimated total years of professional experience from text."""
    years = 0.0

    matches = re.findall(
        r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:professional\s+)?experience",
        text,
        re.IGNORECASE,
    )
    if matches:
        extracted = [float(m) for m in matches if float(m) <= 40]
        if extracted:
            years = max(extracted)

    current_year = 2026
    date_ranges = re.findall(
        r"\b(20\d{2}|19\d{2})\s*(?:-|–|to)\s*(20\d{2}|present|current)\b",
        text,
        re.IGNORECASE,
    )
    if date_ranges:
        total_span = 0.0
        for start, end in date_ranges:
            start_yr = int(start)
            end_yr = current_year if end.lower() in ("present", "current") else int(end)
            span = max(0, end_yr - start_yr)
            if 0 < span <= 25:
                total_span += span
        if total_span > years:
            years = min(35.0, total_span)

    if years == 0.0 and len(text.strip()) > 100:
        years = 2.0

    return round(years, 1)


def extract_education_level(text: str) -> Dict[str, Any]:
    """Identify candidate highest education degree and estimated numeric level."""
    text_lower = text.lower()
    highest_level = 0
    degree_name = "Not specified"

    if re.search(r"\b(ph\.?d|doctorate|doctoral)\b", text_lower):
        highest_level = 4
        degree_name = "Ph.D."
    elif re.search(r"\b(master'?s?|m\.?s\.?|msc|mba|m\.?tech)\b", text_lower):
        highest_level = 3
        degree_name = "Master's Degree"
    elif re.search(r"\b(bachelor'?s?|b\.?s\.?|bsc|b\.?tech|b\.?e\.)\b", text_lower):
        highest_level = 2
        degree_name = "Bachelor's Degree"
    elif re.search(r"\b(associate'?s?|diploma)\b", text_lower):
        highest_level = 1
        degree_name = "Associate Degree"

    return {
        "level": highest_level,
        "degree": degree_name,
    }


def parse_resume_profile(text: str) -> Dict[str, Any]:
    """Parse raw resume text into structured candidate attributes."""
    skills = extract_skills_from_text(text)
    years_exp = extract_years_of_experience(text)
    edu = extract_education_level(text)

    if years_exp >= 8:
        seniority = "Lead / Principal"
    elif years_exp >= 5:
        seniority = "Senior"
    elif years_exp >= 2:
        seniority = "Mid-Level"
    else:
        seniority = "Junior / Entry"

    return {
        "skills": skills,
        "years_experience": years_exp,
        "education": edu,
        "seniority": seniority,
        "raw_text_length": len(text),
    }


def parse_job_profile(job_doc: Dict[str, Any]) -> Dict[str, Any]:
    """Extract structured screening criteria from a job posting document."""
    title = job_doc.get("title", "")
    dept = job_doc.get("dept", "")
    desc = job_doc.get("description", "") or ""
    text_block = f"{title} {dept} {desc}"

    extracted_skills = extract_skills_from_text(text_block)
    req_skills_assigned = job_doc.get("required_skills") or []
    pref_skills_assigned = job_doc.get("preferred_skills") or []

    if req_skills_assigned:
        required_skills = [_normalize_skill(s) for s in req_skills_assigned]
    else:
        cut = max(1, int(len(extracted_skills) * 0.65))
        required_skills = extracted_skills[:cut] if extracted_skills else ["Python", "System Design"]

    if pref_skills_assigned:
        preferred_skills = [_normalize_skill(s) for s in pref_skills_assigned]
    else:
        cut = max(1, int(len(extracted_skills) * 0.65))
        preferred_skills = extracted_skills[cut:] if len(extracted_skills) > cut else ["Docker", "Testing"]

    min_exp = float(job_doc.get("min_years_experience") or 0.0)
    if min_exp == 0.0:
        exp_match = re.search(r"(\d+)\+?\s*(?:years?|yrs?)", text_block, re.IGNORECASE)
        if exp_match:
            min_exp = float(exp_match.group(1))
        else:
            if any(w in title.lower() for w in ("senior", "sr", "lead", "staff", "principal")):
                min_exp = 5.0
            elif any(w in title.lower() for w in ("junior", "entry", "intern")):
                min_exp = 0.0
            else:
                min_exp = 2.0

    edu_info = extract_education_level(text_block)
    min_edu_level = max(2, edu_info["level"])

    return {
        "title": title,
        "dept": dept,
        "required_skills": required_skills,
        "preferred_skills": preferred_skills,
        "min_experience_years": min_exp,
        "min_education_level": min_edu_level,
        "education_degree": edu_info["degree"],
    }
