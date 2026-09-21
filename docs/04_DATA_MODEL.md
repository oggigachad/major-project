# Data Model Specification: EvalixAI

## 1. Primary MongoDB Collections & Schemas

### 1.1 `users`
Represents recruiters, administrators, and reviewers.
```json
{
  "_id": "ObjectId",
  "email": "string (unique, indexed)",
  "full_name": "string",
  "hashed_password": "string (bcrypt)",
  "role": "enum (admin, recruiter, reviewer)",
  "organization_id": "string",
  "failed_login_attempts": "int",
  "locked_until": "ISODate | null",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### 1.2 `jobs`
Job requisitions containing requirements, weights, and criteria.
```json
{
  "_id": "ObjectId",
  "slug": "string (unique, indexed)",
  "title": "string",
  "department": "string",
  "location": "string",
  "status": "enum (draft, open, paused, closed)",
  "description": "string",
  "required_skills": ["string"],
  "preferred_skills": ["string"],
  "min_experience_years": "int",
  "weights": {
    "resume": "float (0.0 - 1.0)",
    "assessment": "float (0.0 - 1.0)",
    "interview": "float (0.0 - 1.0)",
    "coding": "float (0.0 - 1.0)"
  },
  "created_by": "ObjectId (ref: users)",
  "created_at": "ISODate"
}
```

### 1.3 `candidates`
Candidate profiles, pipeline progression, and scores.
```json
{
  "_id": "ObjectId",
  "job_id": "ObjectId (ref: jobs, indexed)",
  "full_name": "string",
  "email": "string (indexed)",
  "phone": "string",
  "resume_url": "string (S3 key)",
  "stage": "enum (applied, screened, assessment, interview, offer, rejected)",
  "scores": {
    "resume_score": "float (0 - 100)",
    "assessment_score": "float (0 - 100)",
    "interview_score": "float (0 - 100)",
    "coding_score": "float (0 - 100)",
    "composite_score": "float (0 - 100)"
  },
  "extracted_profile": {
    "skills": ["string"],
    "experience_years": "float",
    "education": [{"degree": "string", "institution": "string", "year": "int"}],
    "work_history": [{"title": "string", "company": "string", "duration": "string"}]
  },
  "qdrant_point_id": "string (UUID)",
  "proctoring_flags": [
    {
      "timestamp": "ISODate",
      "event_type": "string (tab_blur, fullscreen_exit, multiple_faces)",
      "severity": "enum (low, medium, high)"
    }
  ],
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### 1.4 `assessments`
Test questions, candidate answers, and scoring results.
```json
{
  "_id": "ObjectId",
  "candidate_id": "ObjectId (ref: candidates, indexed)",
  "job_id": "ObjectId (ref: jobs)",
  "status": "enum (scheduled, in_progress, completed, expired, invalidated)",
  "time_limit_minutes": "int",
  "started_at": "ISODate",
  "completed_at": "ISODate",
  "questions": [
    {
      "id": "string",
      "type": "enum (mcq, multi_select, short_answer, code)",
      "prompt": "string",
      "options": ["string"],
      "candidate_answer": "any",
      "is_correct": "boolean | null",
      "score": "float"
    }
  ],
  "total_score": "float"
}
```

---

## 2. Qdrant Vector Collection: `candidate_profiles`
- **Vector Dimension:** 1536 (OpenAI / Claude text embedding model) or 384 (all-MiniLM-L6-v2 fallback).
- **Metric:** Cosine distance.
- **Payload Indexing:**
  - `job_id` (keyword)
  - `skills` (keyword list)
  - `experience_years` (integer range)
