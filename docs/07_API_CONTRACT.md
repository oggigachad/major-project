# API Contract Specification: EvalixAI

All endpoints are prefixed with `/api/v1` and return JSON payloads.

---

## 1. Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register new recruiter account | No |
| `POST` | `/auth/login` | Authenticate credentials & issue cookies | No |
| `POST` | `/auth/refresh` | Single-use refresh token rotation | No (Cookie) |
| `POST` | `/auth/logout` | Revoke session & clear cookies | Yes |
| `GET` | `/auth/me` | Fetch authenticated user profile | Yes |

---

## 2. Jobs Management (`/api/v1/jobs`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/jobs` | List all requisitions with aggregate counts | Yes |
| `POST` | `/jobs` | Create a new job requisition | Yes (Admin/Recruiter) |
| `GET` | `/jobs/{slug}` | Fetch detailed job spec and weights | Yes |
| `PATCH` | `/jobs/{slug}` | Update job status, criteria, or weights | Yes (Admin/Recruiter) |
| `POST` | `/jobs/{slug}/screen` | Trigger semantic vector screening | Yes |

---

## 3. Candidate Management (`/api/v1/candidates`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/candidates` | Query, filter, and sort candidate profiles | Yes |
| `POST` | `/candidates` | Register a new candidate (manual or intake) | No / Yes |
| `GET` | `/candidates/{id}` | Detailed scorecard, audit trail & resume | Yes |
| `PATCH` | `/candidates/{id}/stage` | Advance or reject candidate in pipeline | Yes |
| `POST` | `/candidates/{id}/rescore` | Recalculate composite score on weights | Yes |

---

## 4. Assessment & Proctoring (`/api/v1/assessments`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/assessments/start` | Start timed test session & get questions | Candidate Token |
| `POST` | `/assessments/{id}/telemetry` | Log proctoring events (blur, tab switch) | Candidate Token |
| `POST` | `/assessments/{id}/submit` | Submit answers for auto-grading | Candidate Token |

---

## 5. Storage Uploads & Health
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/uploads/presign` | Request presigned S3 PUT URL for resume | Optional / Token |
| `GET` | `/health` | Deep health check (Mongo, Redis, Qdrant, S3) | No |
| `GET` | `/health/live` | Process liveness probe | No |
