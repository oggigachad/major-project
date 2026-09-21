# Technical Requirements Document (TRD): EvalixAI

## 1. System Architecture Specifications
- **Client App:** Next.js 16.1 (React 19, Turbopack, App Router, TypeScript 5.7).
- **Backend Service:** FastAPI 0.115 (Python 3.12, Starlette, Uvicorn ASGI).
- **Database Engine:** MongoDB 7.0 Community / Atlas (Motor async client driver).
- **Vector Search:** Qdrant v1.12 (REST & gRPC engine, HNSW cosine index).
- **In-Memory Store:** Redis 7.0 Alpine (sessions, rate limits, caching).
- **Object Storage:** SeaweedFS / MinIO S3 API gateway.

---

## 2. Infrastructure & Communication Protocols
- **HTTP / REST:** JSON payloads over HTTP/2, strictly following OpenAPI 3.1.
- **WebSocket / WebRTC:** Candidate proctoring telemetry streaming and real-time audio/video mock interviews.
- **Microservice Isolation:** Docker Compose orchestration defining dedicated network bridges and healthcheck contracts.

---

## 3. Non-Functional Requirements (NFRs)
1. **Performance:**
   - REST API latency: P50 $< 40\text{ ms}$, P95 $< 150\text{ ms}$.
   - Vector nearest-neighbor query $< 25\text{ ms}$ across 100,000 candidate profiles.
   - Initial page load (FCP) $< 1.2\text{ s}$ on 4G networks.
2. **Scalability:**
   - Stateless backend design permitting horizontal autoscaling behind reverse proxies (Nginx / Cloudflare / Traefik).
   - MongoDB replica sets with sharding support on high-volume collections (`candidates`, `telemetry_events`).
3. **High Availability & Reliability:**
   - Database connection connection-pooling with retry-on-reconnect.
   - Resilient circuit breakers on external LLM calls (KodeKloud / OpenAI / Anthropic) with fallback to deterministic heuristic engines.
4. **Data Durability:**
   - Point-in-time recovery for MongoDB.
   - S3 object versioning and write-once retention policies for candidate submitted resumes.
