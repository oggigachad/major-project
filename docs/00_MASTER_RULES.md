# Master Rules & Core Principles: EvalixAI

## 1. System Vision & Purpose
EvalixAI is an enterprise-grade AI-powered recruitment, screening, proctored assessment, and automated interview platform. It automates candidate intake, resume parsing, multi-tier testing, AI conversational interviewing, and algorithmic ranking to streamline hiring pipelines without requiring manual HR overhead.

---

## 2. Core Architectural Principles
1. **Separation of Concerns:**
   - **Frontend:** Next.js 16 (React 19, App Router, TypeScript, Tailwind CSS, Radix UI).
   - **Backend:** FastAPI (Python 3.12, async endpoints, Pydantic v2 schemas).
   - **Persistence:** MongoDB 7 (primary document store via Motor async driver).
   - **In-Memory & Cache:** Redis 7 (session revocation, distributed rate limiting, cache).
   - **Vector Engine:** Qdrant 1.12+ (dense semantic embedding search & resume matching).
   - **Blob Storage:** SeaweedFS / MinIO S3 API gateway (candidate resumes, test artifacts, interview audio/transcripts).
2. **Deterministic Security & Zero Plaintext Secrets:**
   - Password hashing strictly uses Bcrypt ($\ge 12$ rounds).
   - JWT authentication via `HS256` signed tokens with strictly enforced 15-minute access token lifespan and single-use refresh token rotation with theft detection.
   - Storage of refresh tokens as SHA-256 digests only.
   - Credentials passed via Secure, HttpOnly, SameSite=Lax cookies.
3. **Environment Isolation & Strict Typing:**
   - Configuration strictly driven by environment variables (`.env`).
   - Strong schema validation across all inputs and outputs using Pydantic v2 and TypeScript interfaces.
   - No hardcoded mocks in production paths; database-driven operations throughout.
4. **Idempotency & Resilience:**
   - Idempotent API endpoints for state mutations.
   - Graceful degradation if AI or external services encounter network latency or quotas (fallbacks to heuristic scoring).
   - Asynchronous background tasks for heavy computational jobs (embedding generation, PDF parsing, OCR).

---

## 3. Engineering Standard Guidelines
- **API Versioning:** All REST endpoints must reside under `/api/v1/`.
- **Response Format:** Standardized envelopes for status, errors, and paginated datasets.
- **Audit Logging:** Every administrative action, candidate stage change, and proctoring flag must generate an immutable audit trail entry.
- **Performance Budget:**
  - P95 latency for standard queries $< 100\text{ ms}$.
  - AI resume parsing response under 10 seconds.
  - Assessment response submissions $< 50\text{ ms}$.
