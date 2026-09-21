# Security & Compliance Specification: EvalixAI

## 1. Authentication & Session Architecture
1. **Password Storage:**
   - Bcrypt with work factor $\ge 12$.
   - Plaintext passwords never logged or retained in memory.
   - Constant-time comparison (`fake_compare`) prevents account enumeration via timing attacks.
2. **Token Security:**
   - **Access Token:** Short-lived JWT (15 minutes, `JWT_ACCESS_TTL=900`), stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies (`evalix_at`).
   - **Refresh Token:** Cryptographically strong 384-bit random string, single-use rotation with token reuse detection (theft detection revokes all sessions immediately). Refresh tokens stored as SHA-256 digests.
3. **Brute Force & Account Lockout:**
   - Rate limit: 10 failed logins per 15 minutes per IP.
   - 5 consecutive failed logins trigger a 15-minute account lockout (`locked_until`).

---

## 2. API Defense & Network Security
1. **CSRF Protection:**
   - Enforced Origin and Referer validation against `FRONTEND_ORIGINS`.
2. **Injection Defense:**
   - Parameterized queries and strict Pydantic model validation on all inputs prevent NoSQL injection.
3. **Upload File Sandboxing:**
   - Resume uploads validated for file signature / magic numbers (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
   - Strict size cap of 10MB.
   - Files stored in private S3 buckets with time-limited presigned access URLs.

---

## 3. Compliance & Data Privacy (GDPR & CCPA)
- **PII Anonymization Mode:** Ability to mask candidate name, gender, age, and photo during initial screening to eliminate recruitment bias.
- **Right to Erasure:** Candidate deletion endpoint purges MongoDB records, Qdrant vector points, and S3 resume files completely.
