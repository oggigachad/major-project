"""HTTP-level guards: client IP extraction, Origin allow-list (CSRF
defense-in-depth) and the typed API error used across handlers."""

from typing import Any, Dict
from urllib.parse import urlparse

from fastapi import HTTPException, Request

from app.core.config import get_settings

settings = get_settings()


class ApiError(HTTPException):
    """HTTPException whose detail is rendered as {"error": message, **extra}."""

    def __init__(self, status_code: int, message: str, **extra: Any) -> None:
        super().__init__(status_code=status_code, detail=message)
        self.extra: Dict[str, Any] = extra


def client_ip(request: Request) -> str:
    """Best-effort client IP. X-Forwarded-* headers are only trusted when
    TRUST_PROXY=true (i.e. behind a known reverse proxy)."""
    if settings.trust_proxy:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            return xff.split(",")[0].strip()
        xri = request.headers.get("x-real-ip")
        if xri:
            return xri.strip()
    return request.client.host if request.client else "unknown"


def origin_allowed(request: Request) -> bool:
    """CSRF defense-in-depth for state-changing verbs.

    Auth cookies are SameSite=Lax (which already blocks cross-site POSTs);
    additionally, when a browser sends an Origin header its HOSTNAME must
    either match the request host (ports ignored — reverse proxies like the
    sandbox gateway forward the host without its port, and our own frontend
    may live on a different port) or be explicitly allow-listed in
    FRONTEND_ORIGINS. Non-browser clients (no Origin header) pass through.
    """
    origin = request.headers.get("origin")
    if not origin:
        return True
    host = request.headers.get("host", "")
    try:
        origin_host = urlparse(origin).hostname or ""
    except Exception:
        return False
    host_name = host.split(":")[0]
    if origin_host and origin_host == host_name:
        return True
    return origin.rstrip("/") in settings.frontend_origins_list
