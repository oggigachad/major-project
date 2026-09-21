"""Session lifecycle: DB-backed refresh-token sessions mirrored in Redis
for O(1) validation and instant revocation, with single-use rotation and
reuse (theft) detection — a faithful port of the reference implementation.

Redis keys:
  sess:{session_id} = sha256(refresh token)   — whitelist (expires with TTL)
  rev:{session_id}  = "1"                      — revocation list (access TTL window)
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from redis.asyncio import Redis

from app.core.config import get_settings
from app.core.security import create_refresh_token, hash_token

log = logging.getLogger("evalix.auth")
settings = get_settings()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(value: Optional[datetime]) -> Optional[datetime]:
    if value is None or value.tzinfo is not None:
        return value
    return value.replace(tzinfo=timezone.utc)


async def log_activity(
    db: AsyncIOMotorDatabase, user_id: str, action: str, detail: str, ip: Optional[str] = None
) -> None:
    try:
        await db.activity_log.insert_one(
            {
                "user_id": user_id,
                "action": action,
                "detail": detail,
                "ip": ip,
                "created_at": _now(),
            }
        )
    except Exception as exc:  # audit must never break the request
        log.warning("activity log write failed: %s", exc)


async def create_session(
    db: AsyncIOMotorDatabase, redis: Optional[Redis], user_id: str,
    user_agent: Optional[str], ip: Optional[str],
) -> Dict[str, str]:
    token = create_refresh_token()
    session_id = uuid.uuid4().hex
    await db.sessions.insert_one(
        {
            "id": session_id,
            "user_id": user_id,
            "token_hash": hash_token(token),
            "user_agent": (user_agent or "")[:250] or None,
            "ip": ip,
            "created_at": _now(),
            "expires_at": _now() + timedelta(seconds=settings.jwt_refresh_ttl),
            "revoked_at": None,
        }
    )
    if redis is not None:
        try:
            await redis.set(
                f"sess:{session_id}", hash_token(token), ex=settings.jwt_refresh_ttl
            )
        except Exception:
            pass
    return {"token": token, "session_id": session_id}


async def _session_in_redis(
    redis: Optional[Redis], session_id: str, token_hash: str
) -> bool:
    """True when Redis says the session was revoked (or the entry vanished)."""
    if redis is None:
        return False
    try:
        stored = await redis.get(f"sess:{session_id}")
    except Exception:
        return False
    if stored is None:
        return True  # evicted/missing -> treat as revoked
    return stored != token_hash


async def find_live_session(
    db: AsyncIOMotorDatabase, raw_token: str
) -> Optional[Dict[str, Any]]:
    session = await db.sessions.find_one({"token_hash": hash_token(raw_token)})
    if not session:
        return None
    expires_at = _as_utc(session.get("expires_at")) or _now()
    if session.get("revoked_at") or expires_at < _now():
        return None
    return session


async def revoke_session(
    db: AsyncIOMotorDatabase, redis: Optional[Redis], session_id: str
) -> None:
    await db.sessions.update_one(
        {"id": session_id, "revoked_at": None}, {"$set": {"revoked_at": _now()}}
    )
    if redis is not None:
        try:
            await redis.delete(f"sess:{session_id}")
            # Kill the (still-valid, <=15 min) access token tied to this session.
            await redis.set(f"rev:{session_id}", "1", ex=settings.jwt_access_ttl + 60)
        except Exception:
            pass


async def revoke_all_user_sessions(
    db: AsyncIOMotorDatabase, redis: Optional[Redis], user_id: str
) -> int:
    result = await db.sessions.update_many(
        {"user_id": user_id, "revoked_at": None}, {"$set": {"revoked_at": _now()}}
    )
    ids = [d["id"] async for d in db.sessions.find({"user_id": user_id}, {"id": 1})]
    if redis is not None and ids:
        try:
            pipe = redis.pipeline()
            for sid in ids:
                # Kill live access tokens tied to any of these sessions…
                pipe.set(f"rev:{sid}", "1", ex=settings.jwt_access_ttl + 60)
                # …and drop the refresh whitelist entries.
                pipe.delete(f"sess:{sid}")
            await pipe.execute()
        except Exception:
            pass
    return result.modified_count


async def rotate_session(
    db: AsyncIOMotorDatabase, redis: Optional[Redis], raw_token: str
) -> Optional[Dict[str, Any]]:
    """Single-use rotation: one old token -> one new token.

    Presenting an already-rotated token means the token leaked (theft) —
    every session of that user is revoked immediately.
    """
    token_hash = hash_token(raw_token)
    session = await db.sessions.find_one({"token_hash": token_hash})
    if not session:
        return None  # unknown token — nothing to attribute

    if session.get("revoked_at"):
        # Replay of a rotated token -> assume compromise, nuke everything.
        await revoke_all_user_sessions(db, redis, session["user_id"])
        log.warning("refresh-token REUSE detected — revoked all sessions for %s", session["user_id"])
        return None
    expires_at = _as_utc(session.get("expires_at")) or _now()
    if expires_at < _now():
        return None

    if await _session_in_redis(redis, session["id"], token_hash):
        # Redis whitelist disagrees -> replay from another device.
        await revoke_all_user_sessions(db, redis, session["user_id"])
        log.warning("session whitelist mismatch — revoked all sessions for %s", session["user_id"])
        return None

    await revoke_session(db, redis, session["id"])
    nxt = await create_session(
        db, redis, session["user_id"], session.get("user_agent"), session.get("ip")
    )
    return {"session": session, "next": nxt}
