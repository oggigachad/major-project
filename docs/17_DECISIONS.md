# Architecture Decision Records (ADRs): EvalixAI

## ADR-001: Selection of MongoDB as Primary Data Store
- **Status:** Accepted
- **Context:** The application manages highly dynamic candidate profiles with diverse resume structures, nested work histories, arbitrary skills, and evolving assessment responses.
- **Decision:** Use MongoDB 7 via the async Motor driver instead of relational tables.
- **Consequences:** Provides native JSON document modeling, rapid iteration on candidate schemas, and horizontal sharding capabilities without migration overhead.

---

## ADR-002: Dense Vector Semantic Search via Qdrant
- **Status:** Accepted
- **Context:** Keyword-only searching fails to match candidate skills with differently phrased job requirements (e.g., "K8s" vs "Kubernetes orchestration").
- **Decision:** Utilize Qdrant as dedicated vector store with cosine distance metric over candidate profile embeddings.
- **Consequences:** Sub-20ms vector queries, payload filtering directly on job requisition metadata, and decoupled vector storage from the primary database.

---

## ADR-003: SeaweedFS as S3-Compatible Object Store
- **Status:** Accepted
- **Context:** The upstream MinIO open-source server was archived/relicensed. A lightweight, standard S3 API compliant object store is required for candidate resumes and media recordings.
- **Decision:** Deploy SeaweedFS S3 gateway container.
- **Consequences:** Complete AWS S3 API compatibility with standard `boto3` / `minio` Python client libraries and minimal memory footprint.

---

## ADR-004: JWT with Single-Use Refresh Token Rotation & Theft Detection
- **Status:** Accepted
- **Context:** Need secure stateless authentication that protects against credential theft and session hijacking.
- **Decision:** Issue 15-minute access JWTs in `HttpOnly`, `SameSite=Lax` cookies paired with 384-bit single-use refresh tokens stored as SHA-256 digests. If an already-consumed refresh token is presented, all sessions for the user are immediately revoked.
- **Consequences:** Strong defense against XSS token exfiltration and session replay attacks.
