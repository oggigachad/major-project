# EvalixAI

**AI-powered recruitment & hiring platform** — automates the end-to-end candidate screening pipeline (resume screening → aptitude/technical assessment → AI mock interview → sandboxed coding task → weighted ranking & analytics) for startups and small organizations without an HR team.

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Framer Motion |
| Backend | **FastAPI** (Python 3.12) · Motor (async MongoDB) · PyJWT · bcrypt |
| Primary data store | **MongoDB 7** |
| Semantic matching | **Qdrant** (vector search over candidate profiles) |
| Sessions / rate limits / cache | **Redis 7** |
| Object storage | **SeaweedFS S3 gateway** (S3-compatible; the open-source MinIO server was archived upstream) |
| AI provider | KodeKloud API (optional — offline heuristic provider by default) |

> **No hard-coded data.** Every candidate, job, metric and insight rendered by the app is served by the FastAPI backend from MongoDB. All configuration (URLs, secrets, limits, policies) is environment-driven via `.env`. Demo content enters the database only through the explicit `scripts/seed.py` script.

---

## 1 · Quick start (Docker — recommended)

```bash
cp .env.example .env
# edit JWT_ACCESS_SECRET at minimum:
python3 -c "import secrets; print(secrets.token_hex(48))"

docker compose up -d --build          # mongo + redis + qdrant + s3 + backend + frontend
docker compose --profile seed run --rm seed   # demo dataset + demo user + Qdrant vectors
```

- **Frontend**: http://localhost:3000
- **API docs (FastAPI)**: http://localhost:8000/docs
- **Demo login**: `demo@evalix.ai` / `Demo1234!`

## 2 · Quick start (local development)

Prerequisites: Node.js ≥ 20, Python 3.12, and MongoDB + Redis + Qdrant + an S3 endpoint running locally (or use Docker for just the infra: `docker compose up -d mongo redis qdrant s3`).

```bash
# backend
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env                 # point MONGODB_URL / REDIS_URL at your services
.venv/bin/uvicorn app.main:app --reload --port 8000
.venv/bin/python -m scripts.seed     # demo dataset

# frontend (separate terminal)
npm install
echo 'NEXT_PUBLIC_API_BASE_URL=http://localhost:8000' > .env.local
npm run dev                          # http://localhost:3000
```

### Sandbox / repo scripts

The repo also ships process-manager scripts used by the development sandbox (they download and run MongoDB/Qdrant/SeaweedFS/Redis as local binaries — no Docker needed):

```bash
npm run infra:start     # start redis + mongo + qdrant + seaweedfs + FastAPI backend
npm run infra:stop      # stop everything
npm run db:seed         # (re)seed the demo dataset
npm run api:test        # 44-check API smoke-test suite (auth, lockout, theft detection…)
npm run api:logs        # tail backend logs
```

---

## 3 · Environment configuration

All runtime configuration is environment-driven (see `.env.example` for the full annotated list). Highlights:

| Variable | Purpose | Default |
|---|---|---|
| `JWT_ACCESS_SECRET` | HS256 signing key (≥ 32 chars) — **required** | — |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | token lifetimes (s) | 900 / 604800 |
| `MONGODB_URL` / `MONGODB_DB_NAME` | primary store | `mongodb://127.0.0.1:27017` / `evalixai` |
| `REDIS_URL` | sessions, rate limits, stats cache | `redis://127.0.0.1:6379` |
| `QDRANT_URL`, `ENABLE_VECTOR_SEARCH` | semantic screening | `http://127.0.0.1:6333`, `true` |
| `MINIO_ENDPOINT`, `ENABLE_OBJECT_STORAGE` | S3-compatible storage for resumes | `127.0.0.1:9000`, `true` |
| `FRONTEND_ORIGINS` | CORS + Origin CSRF allow-list | `http://localhost:3000` |
| `AI_PROVIDER` | `heuristic` (offline) or `kodekloud` (external API) | `heuristic` |
| `RATE_LOGIN_IP`, `MAX_FAILED_LOGINS`, … | brute-force policy | see `.env.example` |

Frontend mode resolution (`src/lib/api-client.ts`):
1. `NEXT_PUBLIC_API_BASE_URL` → direct calls to the FastAPI backend (default for local dev / Docker)
2. `NEXT_PUBLIC_API_PORT` → same-origin gateway proxy mode (`?XTransformPort=`)
3. neither → relative paths (single-domain reverse-proxy deployments)

---

## 4 · API reference (prefix `/api/v1`)

Interactive docs at `/docs` (Swagger UI) when `DOCS_ENABLED=true`.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` · `/health/live` | infra status (mongo/redis/qdrant/s3) · liveness |
| `POST` | `/auth/register` | create account + session (5/hour per IP) |
| `POST` | `/auth/login` | credentials → cookies (per-IP + per-account limits, 5-fail lockout) |
| `POST` | `/auth/refresh` | single-use refresh rotation + theft detection |
| `POST` | `/auth/logout` | revoke session server-side, clear cookies |
| `GET` | `/auth/me` | current user (DB-backed) |
| `GET` | `/candidates?search=&stage=&sort=` | candidate list (regex-escaped search) |
| `PATCH` | `/candidates/{slug}` | toggle shortlist |
| `POST` | `/candidates/{slug}/stage` | `advance` / `reject` / `restore` state machine |
| `GET` / `POST` | `/jobs` | list jobs / create job |
| `POST` | `/jobs/{slug}/screen` | **AI semantic screening** (Qdrant; lexical fallback) |
| `GET` | `/stats` | dashboard KPIs, funnel, flow, insights, upcoming (Redis-cached 30 s) |
| `POST` | `/uploads/presign` | presigned S3 PUT for resume uploads |

All errors return `{"error": "message", …}`; auth cookies are httpOnly (`evalix_at` path `/`, `evalix_rt` path `/api/v1/auth`).

## 5 · Project structure

```
├── src/                        # Next.js 16 frontend
│   ├── app/                    # / (landing) · /login · /signup · /dashboard/*
│   ├── components/
│   │   ├── landing/            # marketing page (Granola-inspired design)
│   │   ├── auth/               # login/signup with sliding image panel
│   │   └── dashboard/          # overview, candidates, jobs (API-driven)
│   ├── lib/api-client.ts       # env-driven API client + silent refresh
│   └── middleware.ts           # edge JWT guard + security headers
├── backend/                    # FastAPI service
│   ├── app/
│   │   ├── core/               # config (pydantic-settings), security, guards, rate limiting
│   │   ├── db/                 # motor, redis, qdrant, minio clients
│   │   ├── api/v1/             # auth, candidates, jobs, stats, health, uploads
│   │   ├── services/           # sessions, stats aggregation, AI screening
│   │   └── serializers.py      # Mongo docs → frontend JSON shapes
│   ├── scripts/seed.py         # demo dataset → MongoDB + Qdrant
│   └── requirements.txt
├── scripts/                    # infra lifecycle (sandbox), API smoke tests
├── docker-compose.yml          # mongo + redis + qdrant + seaweedfs + backend + frontend
├── Dockerfile                  # frontend standalone image
└── .env.example                # every configuration variable, annotated
```

## 6 · Security

See **[SECURITY.md](SECURITY.md)** for the full control map (JWT design, refresh rotation & theft detection, brute-force lockout, rate limiting, CSRF posture, headers, secrets handling, and a production checklist). Highlights:

- bcrypt (cost 12) hashing; timing-equalized responses prevent user enumeration
- 15-minute HS256 access JWTs in httpOnly `SameSite=Lax` cookies; 7-day opaque refresh tokens stored only as SHA-256 digests, path-scoped to `/api/v1/auth`
- Single-use refresh rotation — replaying a rotated token is treated as theft and revokes **every** session of that user
- Redis-backed fixed-window rate limits (per-IP + per-account) + 5-failure account lockout (15 min)
- Origin allow-list on all state-changing verbs; 1 MiB body cap; strict security headers on every response

## 7 · Roadmap (from the product specification)

- KodeKloud integration for real resume parsing, interview question generation and response evaluation (`AI_PROVIDER=kodekloud`)
- Sandboxed code execution via Judge0 for the coding-assessment module
- Apache Kafka for asynchronous pipeline processing
- Email (SendGrid/SES), WebRTC interviews, OAuth (Google/LinkedIn), payment gateway
- GDPR/DPDP data-subject workflows and WCAG 2.1 AA audits
