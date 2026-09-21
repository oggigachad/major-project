"""Password hashing, JWT access tokens and opaque refresh tokens.

Access tokens are short-lived HS256 JWTs carried by the `evalix_at` httpOnly
cookie — byte-compatible with the Next.js edge middleware verifier (same
issuer / audience / claims). Refresh tokens are 384-bit random strings that
are never stored raw (only their sha256 digest).
"""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt

from app.core.config import get_settings

settings = get_settings()

# Constant-time dummy compare target so unknown emails take the same time
# as wrong passwords (prevents user enumeration).
DUMMY_HASH = b"$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZUbE0f6bZ0n/2v6wJi5XnC0R2uZyCu"


# ------------------------------ passwords ------------------------------

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(
        plain.encode("utf-8"), bcrypt.gensalt(rounds=settings.bcrypt_rounds)
    ).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def fake_compare(plain: str) -> None:
    """Burn the same CPU cycles as a real bcrypt compare."""
    try:
        bcrypt.checkpw(plain.encode("utf-8"), DUMMY_HASH)
    except Exception:
        pass


# ------------------------------ refresh tokens ------------------------------

def create_refresh_token() -> str:
    return secrets.token_urlsafe(48)  # 384 bits of entropy


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ------------------------------ access JWT ------------------------------

def sign_access_token(sub: str, sid: str, email: str, name: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "sid": sid,
        "email": email,
        "name": name,
        "role": role,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "jti": uuid.uuid4().hex,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=settings.jwt_access_ttl)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_access_secret, algorithm="HS256")


def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(
            token,
            settings.jwt_access_secret,
            algorithms=["HS256"],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
        )
    except Exception:
        return None
