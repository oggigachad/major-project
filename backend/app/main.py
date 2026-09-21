"""EvalixAI FastAPI backend entrypoint.

Stack (per product spec):
  MongoDB (primary store) · Redis (sessions/rate-limit/cache) ·
  Qdrant (semantic resume matching) · MinIO (object storage) ·
  FastAPI service layer with JWT auth.

Everything is configuration-driven — see app/core/config.py and .env.example.
"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1 import (
    analytics,
    assessments,
    auth,
    candidates,
    health,
    interviews,
    jobs,
    screening,
    settings_api,
    stats,
    uploads,
    ws,
)

from app.core.config import get_settings
from app.core.guards import ApiError
from app.db import minio as minio_mod
from app.db import mongo as mongo_mod
from app.db import qdrant as qdrant_mod
from app.db import redis as redis_mod
from app.db.mongo import ensure_indexes

logging.basicConfig(
    level=get_settings().log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("evalix")

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fail fast on unsafe configuration (missing/weak JWT secret etc.).
    settings.validate_runtime()

    # ---- Redis ----
    app.state.redis = redis_mod.create_redis_client()
    if await redis_mod.ping_redis(app.state.redis):
        log.info("redis: connected")
    else:
        log.warning("redis: UNREACHABLE — rate limiting fails open, caches disabled")

    # ---- MongoDB ----
    app.state.mongo = mongo_mod.create_mongo_client()
    app.state.db = app.state.mongo[settings.mongodb_db_name]
    if await mongo_mod.ping_mongo(app.state.mongo):
        await ensure_indexes(app.state.db)
        log.info("mongodb: connected (%s)", settings.mongodb_db_name)
    else:
        log.warning("mongodb: UNREACHABLE — auth endpoints will return 503")

    # ---- Qdrant (optional) ----
    app.state.qdrant = qdrant_mod.create_qdrant_client()
    if app.state.qdrant is not None:
        if await qdrant_mod.ensure_collection(app.state.qdrant):
            log.info("qdrant: connected (collection %s)", settings.qdrant_collection)
        else:
            app.state.qdrant = None
    else:
        log.info("qdrant: disabled (ENABLE_VECTOR_SEARCH=false)")

    # ---- MinIO (optional) ----
    app.state.minio = minio_mod.create_minio_client()
    if app.state.minio is not None:
        if minio_mod.ensure_bucket(app.state.minio):
            log.info("minio: connected (bucket %s)", settings.minio_bucket)
        else:
            app.state.minio = None
    else:
        log.info("minio: disabled")

    # ---- WebSocket manager ----
    app.state.ws_manager = ws.ws_manager

    log.info(
        "%s v%s ready (env=%s, prefix=%s)",
        settings.app_name, settings.app_version, settings.environment, settings.api_prefix,
    )
    yield


    # ---- graceful shutdown ----
    for closer in (
        ("redis", lambda: app.state.redis.aclose()),
        ("mongo", lambda: app.state.mongo.close()),
        ("qdrant", lambda: app.state.qdrant.close()),
    ):
        try:
            closer[1]()
        except Exception:
            pass
    log.info("shutdown complete")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "AI-powered recruitment platform API — auth, candidate pipeline, "
        "jobs, screening and analytics. All configuration is environment-driven."
    ),
    lifespan=lifespan,
    docs_url="/docs" if settings.docs_enabled else None,
    redoc_url="/redoc" if settings.docs_enabled else None,
    openapi_url="/openapi.json" if settings.docs_enabled else None,
)

# ------------------------------ CORS ------------------------------
# Only allow-listed origins (never "*" — credentials are in play).
if settings.frontend_origins_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.frontend_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type"],
        max_age=600,
    )


# ------------------------------ security middleware ------------------------------

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    # Body size cap (files go via MinIO presigned PUTs, not through the API).
    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > settings.max_body_bytes:
        return JSONResponse({"error": "Request body too large"}, status_code=413)

    started = time.monotonic()
    response = await call_next(request)

    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Resource-Policy"] = "same-site"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    response.headers["X-Response-Time-Ms"] = str(int((time.monotonic() - started) * 1000))
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response


# ------------------------------ error shapes ------------------------------

@app.exception_handler(ApiError)
async def api_error_handler(request: Request, exc: ApiError):
    return JSONResponse({"error": str(exc.detail), **exc.extra}, status_code=exc.status_code)


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse({"error": str(exc.detail)}, status_code=exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    message = first.get("msg") or "Invalid input"
    if message.startswith("Value error, "):
        message = message[len("Value error, "):]
    return JSONResponse(
        {
            "error": message,
            "issues": [
                {"path": ".".join(str(p) for p in e.get("loc", [])[1:]), "message": e.get("msg")}
                for e in exc.errors()
            ],
        },
        status_code=422,
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    log.exception("unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse({"error": "Internal server error"}, status_code=500)


# ------------------------------ routers ------------------------------

API = settings.api_prefix
app.include_router(health.router, prefix=API)
app.include_router(auth.router, prefix=API)
app.include_router(candidates.router, prefix=API)
app.include_router(jobs.router, prefix=API)
app.include_router(stats.router, prefix=API)
app.include_router(uploads.router, prefix=API)
app.include_router(screening.router, prefix=API)
app.include_router(assessments.router, prefix=API)
app.include_router(interviews.router, prefix=API)
app.include_router(analytics.router, prefix=API)
app.include_router(settings_api.router, prefix=API)
app.include_router(ws.router, prefix=API)



@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "docs": "/docs" if settings.docs_enabled else None,
        "api": settings.api_prefix,
    }
