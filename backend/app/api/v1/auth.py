"""Auth endpoints: register / login / refresh / logout / me.

Security posture (see SECURITY.md):
  * bcrypt (cost 12) password hashing, timing-equalized unknown emails
  * per-IP and per-account rate limits (Redis fixed window)
  * account lockout after MAX_FAILED_LOGINS consecutive failures
  * access JWT in an httpOnly SameSite=Lax cookie (15 min)
  * opaque refresh token in a path-scoped httpOnly cookie (7 days),
    single-use rotation with reuse (theft) detection
  * Origin allow-list on every state-changing verb
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse as Resp

from app.api.deps import db_from, get_payload, redis_from
from app.core.config import get_settings
from app.core.guards import ApiError, client_ip, origin_allowed
from app.core.rate_limit import parse_rule, rate_limit
from app.core.security import fake_compare, hash_password, sign_access_token, verify_password
from app.db.mongo import user_public
from app.schemas.requests import LoginIn, RegisterIn
from app.services import auth_service

log = logging.getLogger("evalix.auth")
settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])


# ------------------------------ cookie helpers ------------------------------

def _set_access_cookie(response, request: Request, sub: str, sid: str, email: str, name: str, role: str) -> None:
    response.set_cookie(
        settings.access_cookie,
        sign_access_token(sub, sid, email, name, role),
        httponly=True,
        samesite="lax",
        secure=settings.is_production and request.url.scheme == "https",
        path="/",
        max_age=settings.jwt_access_ttl,
    )


def _set_refresh_cookie(response, request: Request, token: str, persistent: bool = True) -> None:
    kwargs: Dict[str, Any] = {
        "httponly": True,
        "samesite": "lax",
        "secure": settings.is_production and request.url.scheme == "https",
        "path": settings.refresh_cookie_path,
    }
    if persistent:
        kwargs["max_age"] = settings.jwt_refresh_ttl
    response.set_cookie(settings.refresh_cookie, token, **kwargs)


def _clear_auth_cookies(response) -> None:
    response.delete_cookie(settings.access_cookie, path="/")
    response.delete_cookie(settings.refresh_cookie, path=settings.refresh_cookie_path)


def _user_payload(user: Dict[str, Any]) -> Dict[str, str]:
    return {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}


# ------------------------------ POST /register ------------------------------

@router.post("/register")
async def register(body: RegisterIn, request: Request):
    if not origin_allowed(request):
        raise ApiError(403, "Cross-origin request rejected")

    db = db_from(request)
    redis = redis_from(request)
    ip = client_ip(request)

    limit, window = parse_rule(settings.rate_register)
    ok, remaining, retry_after = await rate_limit(redis, f"register:{ip}", limit, window)
    if not ok:
        raise ApiError(429, "Too many sign-up attempts. Try again later.", retryAfter=retry_after)

    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise ApiError(409, "An account with this email already exists")

    now = datetime.now(timezone.utc)
    user = {
        "id": uuid.uuid4().hex,
        "email": body.email,
        "name": body.name,
        "password_hash": hash_password(body.password),
        "role": "RECRUITER",
        "failed_login_attempts": 0,
        "locked_until": None,
        "last_login_at": now,
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(user)
    await auth_service.log_activity(db, user["id"], "register", f"Account created for {body.email}", ip)

    session = await auth_service.create_session(
        db, redis, user["id"], request.headers.get("user-agent"), ip
    )
    resp = Resp({"user": _user_payload(user)})
    resp.headers["X-RateLimit-Remaining"] = str(remaining)
    _set_access_cookie(resp, request, user["id"], session["session_id"], user["email"], user["name"], user["role"])
    _set_refresh_cookie(resp, request, session["token"])
    return resp


# ------------------------------ POST /login ------------------------------

@router.post("/login")
async def login(body: LoginIn, request: Request):
    if not origin_allowed(request):
        raise ApiError(403, "Cross-origin request rejected")

    db = db_from(request)
    redis = redis_from(request)
    ip = client_ip(request)

    # Two rate limits: per-IP and per-account.
    ip_limit, ip_window = parse_rule(settings.rate_login_ip)
    ok, _, retry_after = await rate_limit(redis, f"login:ip:{ip}", ip_limit, ip_window)
    if not ok:
        raise ApiError(429, "Too many login attempts. Please wait a moment.", retryAfter=retry_after)
    acct_limit, acct_window = parse_rule(settings.rate_login_account)
    ok, _, retry_after = await rate_limit(redis, f"login:acct:{body.email}", acct_limit, acct_window)
    if not ok:
        raise ApiError(429, "Too many attempts for this account. Please wait a moment.", retryAfter=retry_after)

    GENERIC = "Invalid email or password"
    user = await db.users.find_one({"email": body.email})

    if not user:
        fake_compare(body.password)  # equalize timing -> no user enumeration
        raise ApiError(401, GENERIC)

    locked_until = user.get("locked_until")
    if locked_until and locked_until.tzinfo is None:
        locked_until = locked_until.replace(tzinfo=timezone.utc)
    if locked_until and locked_until > datetime.now(timezone.utc):
        mins = max(1, -(-(locked_until - datetime.now(timezone.utc)).seconds // 60))
        raise ApiError(423, f"Account temporarily locked. Try again in {mins} minute(s).")

    if not verify_password(body.password, user["password_hash"]):
        failed = user.get("failed_login_attempts", 0) + 1
        lock = failed >= settings.max_failed_logins
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "failed_login_attempts": 0 if lock else failed,
                    "locked_until": (
                        datetime.now(timezone.utc) + timedelta(minutes=settings.lockout_minutes)
                    )
                    if lock
                    else None,
                }
            },
        )
        await auth_service.log_activity(
            db,
            user["id"],
            "locked_out" if lock else "login_failed",
            f"{settings.max_failed_logins} consecutive failures"
            if lock
            else f"Failed attempt {failed}/{settings.max_failed_logins}",
            ip,
        )
        if lock:
            raise ApiError(
                423,
                f"Too many failed attempts. Account locked for {settings.lockout_minutes} minutes.",
            )
        raise ApiError(401, GENERIC)

    # Success — reset counters, stamp login, create session.
    now = datetime.now(timezone.utc)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"failed_login_attempts": 0, "locked_until": None, "last_login_at": now}},
    )
    session = await auth_service.create_session(
        db, redis, user["id"], request.headers.get("user-agent"), ip
    )
    await auth_service.log_activity(db, user["id"], "login", "Signed in with password", ip)

    resp = Resp({"user": _user_payload(user)})
    _set_access_cookie(resp, request, user["id"], session["session_id"], user["email"], user["name"], user["role"])
    _set_refresh_cookie(resp, request, session["token"], persistent=body.remember)
    return resp


# ------------------------------ POST /refresh ------------------------------

@router.post("/refresh")
async def refresh(request: Request):
    if not origin_allowed(request):
        raise ApiError(403, "Cross-origin request rejected")

    db = db_from(request)
    redis = redis_from(request)

    raw = request.cookies.get(settings.refresh_cookie)
    if not raw:
        resp = Resp({"error": "No refresh token presented"}, status_code=401)
        _clear_auth_cookies(resp)
        return resp

    rotated = await auth_service.rotate_session(db, redis, raw)
    if not rotated:
        resp = Resp({"error": "Session expired or revoked. Please sign in again."}, status_code=401)
        _clear_auth_cookies(resp)
        return resp

    session = rotated["session"]
    nxt = rotated["next"]
    user = await db.users.find_one({"id": session["user_id"]})
    if not user:
        resp = Resp({"error": "Session expired or revoked. Please sign in again."}, status_code=401)
        _clear_auth_cookies(resp)
        return resp

    resp = Resp({"user": _user_payload(user)})
    _set_access_cookie(resp, request, user["id"], nxt["session_id"], user["email"], user["name"], user["role"])
    _set_refresh_cookie(resp, request, nxt["token"])
    return resp


# ------------------------------ POST /logout ------------------------------

@router.post("/logout")
async def logout(request: Request):
    if not origin_allowed(request):
        raise ApiError(403, "Cross-origin request rejected")

    db = db_from(request)
    redis = redis_from(request)
    ip = client_ip(request)

    try:
        claims = await get_payload(request)
        sid = claims.get("sid")
        if sid:
            await auth_service.revoke_session(db, redis, sid)
            await auth_service.log_activity(db, claims["sub"], "logout", "Session revoked", ip)
    except ApiError:
        # Access token already expired — still revoke the refresh session.
        raw = request.cookies.get(settings.refresh_cookie)
        if raw:
            session = await auth_service.find_live_session(db, raw)
            if session:
                await auth_service.revoke_session(db, redis, session["id"])
                await auth_service.log_activity(
                    db, session["user_id"], "logout", "Session revoked", ip
                )

    resp = Resp({"loggedOut": True})
    _clear_auth_cookies(resp)
    return resp


# ------------------------------ GET /me ------------------------------

@router.get("/me")
async def me(request: Request, claims: Dict[str, Any] = Depends(get_payload)):
    db = db_from(request)
    user = await db.users.find_one({"id": claims["sub"]})
    public = user_public(user)
    if not public:
        raise ApiError(401, "Account no longer exists")
    return {"user": public}
