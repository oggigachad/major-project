# GitHub Actions CI/CD Specification: EvalixAI

## 1. Pipeline Overview
Continuous Integration and Deployment pipelines ensure automated quality gates on every Pull Request and main branch commit.

---

## 2. CI Workflow (`.github/workflows/ci.yml`)
- **Triggers:** Push to `main`, pull requests targeting `main`.
- **Jobs:**
  1. **Frontend Lint & Typecheck:**
     - Node 22 environment.
     - `npm ci`
     - `npm run lint` (ESLint 9)
     - `npx tsc --noEmit`
  2. **Backend Unit & Contract Tests:**
     - Python 3.12 environment.
     - Services: Spin up ephemeral MongoDB, Redis, and Qdrant containers.
     - `pytest -v backend/tests/`
     - Security audit: `bandit -r backend/app/`
  3. **Docker Container Builds:**
     - Verify multi-stage Docker build succeeds for both `Dockerfile` (Next.js) and `backend/Dockerfile` (FastAPI).

---

## 3. CD Deployment Workflow (`.github/workflows/deploy.yml`)
- **Triggers:** Tagged releases (`v*.*.*`) or merged PRs to `production`.
- **Steps:**
  1. Build and push versioned Docker images to GitHub Container Registry (GHCR) or AWS ECR.
  2. Run database migration / index sync scripts (`ensure_indexes()`).
  3. Trigger zero-downtime rolling deployment (Kubernetes / AWS ECS / CapRover).
  4. Execute synthetic health check against `/api/v1/health`.
