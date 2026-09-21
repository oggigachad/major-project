# Error Handling & Resilience Specification: EvalixAI

## 1. Error Response Envelope Format
All API errors return RFC 7807 compliant problem details:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Candidate with id '6601a4b9c1d' was not found",
    "details": {},
    "timestamp": "2026-09-21T17:00:00Z",
    "path": "/api/v1/candidates/6601a4b9c1d"
  }
}
```

---

## 2. Standardized Error Catalog
| HTTP Code | Error Code | Scenario |
|---|---|---|
| `400` | `INVALID_INPUT` | Pydantic validation failed, missing required fields |
| `401` | `UNAUTHORIZED` | Expired/invalid access token or missing credentials |
| `403` | `FORBIDDEN` | Insufficient role permissions or CSRF token mismatch |
| `404` | `NOT_FOUND` | Requisition or candidate does not exist |
| `409` | `CONFLICT` | Duplicate email address during account registration |
| `422` | `UNPROCESSABLE_ENTITY` | Corrupt resume file or unsupported MIME type |
| `429` | `RATE_LIMITED` | Exceeded login attempts or candidate submission threshold |
| `502` | `UPSTREAM_SERVICE_ERROR` | Qdrant or S3 communication failure |
| `503` | `SERVICE_DEGRADED` | AI LLM provider unavailable, fallen back to heuristic engine |

---

## 3. Resilience & Graceful Fallbacks
1. **AI / LLM Timeouts:**
   - 30-second timeout ceiling.
   - On timeout or HTTP 5xx from AI provider, fall back to regex-based keyword extraction and heuristic semantic scoring so candidate submission completes.
2. **Database Connection Pool Exhaustion:**
   - Automatic exponential backoff with jitter on reconnect attempts.
3. **Assessment Session Recovery:**
   - Candidate answers continuously autosaved in Redis and synced to MongoDB every 15 seconds.
   - If network connection drops, a 5-minute reconnect grace period allows test resumption without penalty.
