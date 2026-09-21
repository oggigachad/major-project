"""Fixed-window rate limiter backed by Redis (INCR + EXPIRE).

Mirrors the reference implementation: if Redis is unreachable the limiter
fails OPEN (returns ok) so availability is preserved — the outage is logged
by the caller. Limits are configurable through env ("requests/seconds").
"""

from typing import Optional, Tuple

from redis.asyncio import Redis

from app.core.config import get_settings

settings = get_settings()


def parse_rule(rule: str) -> Tuple[int, int]:
    """'10/900' -> (10 requests, 900 second window)."""
    try:
        count, seconds = rule.split("/")
        return max(1, int(count)), max(1, int(seconds))
    except Exception:
        return 10, 60


async def rate_limit(
    redis: Optional[Redis], key: str, limit: int, window_sec: int
) -> Tuple[bool, int, int]:
    """Returns (ok, remaining, retry_after_seconds)."""
    if redis is None:
        return True, limit, 0
    redis_key = f"rl:{key}"
    try:
        count = await redis.incr(redis_key)
        if count == 1:
            await redis.expire(redis_key, window_sec)
        if count > limit:
            ttl = await redis.ttl(redis_key)
            return False, 0, ttl if ttl > 0 else window_sec
        return True, max(0, limit - count), 0
    except Exception:
        # Redis down — fail open (documented trade-off, see SECURITY.md).
        return True, limit, 0
