# Architecture Specification: EvalixAI

## 1. System Context Diagram
```mermaid
graph TD
    ClientBrowser[Browser: Recruiter Dashboard & Candidate Portal]
    CDN[Edge Gateway / CDN]
    NextApp[Next.js 16 Web Application :3000]
    FastAPIApp[FastAPI Backend Service :8000]
    Mongo[(MongoDB 7 Data Store :27018)]
    RedisCache[(Redis 7 Sessions & Limits :6380)]
    QdrantDB[(Qdrant Vector Engine :6333)]
    S3Storage[(SeaweedFS S3 Storage :9000)]
    LLMAPI[External LLM Providers - KodeKloud / OpenAI]

    ClientBrowser -->|HTTP / WebSocket| NextApp
    NextApp -->|API Proxy / Direct REST| FastAPIApp
    FastAPIApp -->|Async Motor| Mongo
    FastAPIApp -->|Redis-py| RedisCache
    FastAPIApp -->|Qdrant Client| QdrantDB
    FastAPIApp -->|MinIO SDK / S3 API| S3Storage
    FastAPIApp -->|Async HTTP| LLMAPI
```

---

## 2. Component Subsystems
1. **Frontend Presentation Layer (`src/`):**
   - **`src/app/(dashboard)/`**: Protected recruiter management cockpit (pipeline, candidates, jobs, analytics).
   - **`src/app/(portal)/`**: Public candidate interface for job applications, proctored testing, and interview room.
   - **`src/components/ui/`**: Radix UI + Tailwind CSS atomic design components.
   - **`src/lib/api-client.ts`**: Unified Axios/Fetch API client featuring automatic credentials handling and token refresh.
2. **Backend Application Layer (`backend/app/`):**
   - **`api/v1/`**: Routers for `auth`, `jobs`, `candidates`, `assessments`, `interviews`, `analytics`, `uploads`.
   - **`core/`**: Security (`bcrypt`, `jwt`), database managers, settings, and CORS policies.
   - **`services/`**: Domain services:
     - `evalix_screening`: Resume parsing, heuristic evaluation, Qdrant vector operations.
     - `evalix_interview`: Question generator, speech evaluation, scoring synthesis.
     - `evalix_proctoring`: Anomaly detection, telemetry aggregation, violation tracking.
   - **`models/` & `schemas/`**: Pydantic v2 schemas and validation models.
3. **Data & Storage Infrastructure:**
   - **MongoDB collections:** `users`, `jobs`, `candidates`, `assessments`, `interviews`, `audit_logs`.
   - **Qdrant collections:** `candidate_profiles` with 384/1536-dimensional dense vectors.
   - **S3 Buckets:** `resumes`, `interview-recordings`, `audit-exports`.
