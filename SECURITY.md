# EvalixAI — Security Documentation

This document maps the security controls implemented in this codebase, in the
spirit of a structured security audit (inspired by Cloudflare's
[security-audit-skill](https://github.com/cloudflare/security-audit-skill)
checklists: secrets, authn/authz, injection, transport, headers, abuse
protection).

## Control map

| # | Control | Where | Notes |
|---|---|---|---|
| 1 | Secrets management | `.env` only; `app/core/config.py` validates at startup | No secrets in source or images; `JWT_ACCESS_SECRET` must be ≥ 32 chars or the API refuses to start |
| 2 | Password storage | `app/core/security.py` | bcrypt, cost 12 (`BCRYPT_ROUNDS`, env-tunable) |
| 3 | Password policy | `app/schemas/requests.py` | ≥ 8 chars, must contain a letter and a digit, 128-char cap |
| 4 | User enumeration | `app/api/v1/auth.py` | Unknown emails run a dummy bcrypt compare (`fake_compare`) so response timing matches wrong-password attempts; identical generic 401 |
| 5 | Access tokens | `app/core/security.py` | HS256 JWT, 15-min TTL, `iss`/`aud`/`jti`/`iat`/`exp`, carried in an httpOnly `SameSite=Lax` cookie (`evalix_at`, path `/`) |
| 6 | Refresh tokens | `app/services/auth_service.py` | 384-bit random opaque tokens; only the SHA-256 digest is stored; httpOnly cookie path-scoped to `/api/v1/auth` |
| 7 | Refresh rotation | `rotate_session()` | Single-use: one old token → one new token per refresh |
| 8 | **Token theft detection** | `rotate_session()` | Replaying an already-rotated token revokes **all** sessions of that user immediately; Redis whitelist mismatch does the same |
| 9 | Session revocation | `revoke_session()` + `api/deps.py` | Logout revokes server-side; live access tokens die via the `rev:{sid}` Redis list **and** an authoritative MongoDB `revoked_at` check on every request (covers a Redis outage) |
| 10 | Rate limiting | `app/core/rate_limit.py` | Redis fixed-window (INCR+EXPIRE): login 10/15 min per IP **and** 6/15 min per account; register 5/hour per IP — all env-tunable |
| 11 | Account lockout | `app/api/v1/auth.py` | 5 consecutive failures → 15-minute lock (423), counters reset on success |
| 12 | CSRF defense-in-depth | `app/core/guards.py` | `SameSite=Lax` cookies + Origin allow-list on every state-changing verb (matching host or `FRONTEND_ORIGINS`) |
| 13 | Input validation | Pydantic v2 schemas | Strict field constraints, length caps, enum checks, regex-escaped MongoDB search (no `$`-operator injection), whitelisted upload MIME types/extensions |
| 14 | Injection safety | Motor typed filters | No raw user input ever reaches `$where`/`$expr`; search uses `re.escape` + `$regex` on fixed fields |
| 15 | Body size cap | `app/main.py` | 1 MiB JSON limit (413); files upload via presigned S3 PUTs, never through the API |
| 16 | Security headers | `app/main.py` middleware | `no-store`, `nosniff`, `DENY` framing, no-referrer, Permissions-Policy, COOP/CORP, restrictive CSP (`default-src 'none'`), HSTS in production |
| 17 | CORS | strict origin list | `allow_origins` from `FRONTEND_ORIGINS` only, `allow_credentials=true` (never `*`) |
| 18 | Docs exposure | `DOCS_ENABLED` | Swagger/Redoc disabled in the production compose profile |
| 19 | Container hardening | `backend/Dockerfile` | python:3.12-slim, unprivileged UID 10001, HEALTHCHECK, no build secrets |
| 20 | Audit trail | `activity_log` collection | register / login / login_failed / locked_out / logout / stage_change / job_created events with user, detail and IP |
| 21 | Availability trade-offs | rate limiter | If Redis is unreachable the limiter **fails open** (availability over strictness) — flagged here deliberately; the lockout counter still works through MongoDB once the user exists |
| 22 | Proxy awareness | `TRUST_PROXY` | `X-Forwarded-For` is only honored when explicitly enabled, preventing header spoofing of rate-limit keys |

## Verified by the test suite

`npm run api:test` (`scripts/api-test.sh`) — 44 checks including:

- unauthenticated access → 401 · cross-origin login → 403
- registration + cookie attributes (httpOnly paths)
- login / me / refresh rotation
- **refresh replay → 401 and every session revoked**
- logout revokes the live access token
- 5 failed logins → account locked (423)
- validation rejections (invalid stage, bad job type, `.exe` upload)
- AI screening + presigned upload happy paths

## Production checklist

- [ ] Set `ENVIRONMENT=production` (adds HSTS; disable `DOCS_ENABLED`)
- [ ] Rotate `JWT_ACCESS_SECRET` — 48+ random hex chars, stored in a secret manager
- [ ] Serve exclusively over TLS (terminate at the proxy; cookies become `Secure` automatically)
- [ ] Set `FRONTEND_ORIGINS` to the exact browser origins
- [ ] Set `TRUST_PROXY=true` **only** behind a trusted reverse proxy
- [ ] Restrict MongoDB/Redis/Qdrant/S3 to the compose network (remove the `127.0.0.1:` host port mappings)
- [ ] Enable Redis persistence (`appendonly yes`) if revocation lists must survive restarts
- [ ] Add log shipping for the `activity_log` + structured API logs
- [ ] Run `npm run api:test` against the deployed stack as a smoke gate

## Reporting

Suspected vulnerabilities in this project should be reported to the
maintainers privately — please do not open public issues with exploit details.
