"""FastAPI dependencies: DB handle + the auth guard.

The guard verifies the `evalix_at` JWT cookie, rejects sessions whose sid
appears on the Redis revocation list (logout / theft detection), and loads
a fresh copy of the user from MongoDB on every protected request.
"""

from typing import Any, Dict

from fastapi import Request

from app.core.config import get_settings
from app.core.guards import ApiError
from app.core.security import verify_access_token

settings = get_settings()


def db_from(request: Request):
    return request.app.state.db


def redis_from(request: Request):
    return getattr(request.app.state, "redis", None)


async def get_payload(request: Request) -> Dict[str, Any]:
    token = request.cookies.get(settings.access_cookie)
    if not token:
        raise ApiError(401, "Authentication required", code="unauthenticated")
    claims = verify_access_token(token)
    if not claims or not claims.get("sid"):
        raise ApiError(401, "Authentication required", code="unauthenticated")

    redis = redis_from(request)
    if redis is not None:
        try:
            if await redis.get(f"rev:{claims['sid']}") == "1":
                raise ApiError(401, "Session revoked", code="unauthenticated")
        except ApiError:
            raise
        except Exception:
            pass

    # Authoritative check (also covers a Redis outage): the session row must
    # still be live, and the user must still exist.
    db = db_from(request)
    if db is not None:
        session = await db.sessions.find_one(
            {"id": claims["sid"], "revoked_at": None}, {"id": 1}
        )
        if not session:
            raise ApiError(401, "Session expired or revoked", code="unauthenticated")
        user = await db.users.find_one({"id": claims["sub"]}, {"id": 1})
        if not user:
            raise ApiError(401, "Authentication required", code="unauthenticated")
    return claims
