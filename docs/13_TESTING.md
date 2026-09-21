# Testing Strategy & QA Specification: EvalixAI

## 1. Test Pyramid & Methodology
1. **Unit Testing:**
   - **Backend:** `pytest` test suite covering password hashing, JWT token generation/rotation, Pydantic schema validation, and score calculation formulas.
   - **Frontend:** Jest & React Testing Library testing atomic UI components and state hooks.
2. **Integration Testing:**
   - Real MongoDB transactions testing candidate stage transitions and job requisition queries.
   - Redis caching and rate-limiting tests validating IP blocks after threshold violations.
   - Qdrant similarity search tests verifying vector upsert and score ranking.
3. **End-to-End (E2E) & Smoke Testing:**
   - Playwright / Cypress automation testing candidate application flow, recruiter login, candidate pipeline moves, and score recalculation sandbox.

---

## 2. API Smoke Test Matrix
The codebase includes an automated API verification suite covering:
- Authentication, invalid passwords, and account lockout after 5 failures.
- Refresh token reuse / theft detection.
- Requisition creation, retrieval, and status updates.
- Presigned S3 upload URL generation and MIME type enforcement.
- Semantic candidate screening and candidate stage progression.
- Infrastructure health check reporting status for Mongo, Redis, Qdrant, and S3.

---

## 3. Test Execution Commands
```bash
# Backend pytest suite
cd backend
python -m pytest tests/ -v

# Frontend component tests
npm run test

# Full stack API smoke test
npm run api:test
```
