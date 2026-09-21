# Production Readiness Checklist: EvalixAI

## 1. Security & Secrets Management
- [ ] `JWT_ACCESS_SECRET` regenerated with high-entropy cryptographic random string ($\ge 32$ bytes).
- [ ] `MINIO_SECRET_KEY` and `REDIS_PASSWORD` rotated from default demo values.
- [ ] All production endpoints enforce HTTPS with valid SSL/TLS certificates.
- [ ] Secure cookie flags active: `Secure=True`, `HttpOnly=True`, `SameSite=Lax`.
- [ ] Origin verification active via `FRONTEND_ORIGINS` CORS configuration.

---

## 2. Database & Data Integrity
- [ ] MongoDB unique indexes confirmed on `users.email` and `jobs.slug`.
- [ ] TTL index verified on `sessions` collection for automated cleanup.
- [ ] Qdrant collection `candidate_profiles` created with appropriate vector dimension and cosine metric.
- [ ] S3 bucket `resumes` initialized with private access ACLs and CORS policies.
- [ ] Automated snapshot / backup schedule configured for MongoDB and S3.

---

## 3. Performance & Observability
- [ ] Reverse proxy (Nginx / Cloudflare) configured with gzip/brotli compression and request caching for static assets.
- [ ] Application logging configured with structured JSON logs.
- [ ] System metrics and health probes wired to `/api/v1/health`.
- [ ] Alerting rules established for high error rates ($> 1\%$ 5xx), disk usage ($> 80\%$), and memory thresholds.
