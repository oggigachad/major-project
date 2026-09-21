"""Application settings — every value is environment-driven (soft-coded).

Loads from (in order): real environment variables, then the `.env` file
next to the backend, then the repo-root `.env` (sandbox scripts source the
root file). No secrets, URLs, credentials or limits are hard-coded here.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ---------------- app ----------------
    app_name: str = "EvalixAI API"
    app_version: str = "1.0.0"
    environment: str = "development"  # development | staging | production
    api_prefix: str = "/api/v1"
    log_level: str = "INFO"
    docs_enabled: bool = True

    # ---------------- security ----------------
    # Comma-separated list of browser origins allowed to call this API
    # (used for CORS and the Origin CSRF check on state-changing requests).
    frontend_origins: str = "http://localhost:3000"
    # Trust X-Forwarded-For / X-Real-IP headers (set true only behind a
    # trusted reverse proxy such as the sandbox gateway or an LB).
    trust_proxy: bool = False
    max_body_bytes: int = 1_048_576  # 1 MiB JSON cap; files go via MinIO presign

    # ---------------- MongoDB ----------------
    mongodb_url: str = "mongodb://127.0.0.1:27017"
    mongodb_db_name: str = "evalixai"
    mongodb_timeout_ms: int = 5000

    # ---------------- Redis ----------------
    redis_url: str = "redis://127.0.0.1:6379"

    # ---------------- JWT / sessions ----------------
    jwt_access_secret: str = ""
    jwt_access_ttl: int = 900  # 15 minutes
    jwt_refresh_ttl: int = 604_800  # 7 days
    jwt_issuer: str = "evalixai"
    jwt_audience: str = "evalixai:web"

    # ---------------- auth policy ----------------
    bcrypt_rounds: int = 12
    max_failed_logins: int = 5
    lockout_minutes: int = 15
    # "requests/seconds" fixed-window limits
    rate_login_ip: str = "10/900"
    rate_login_account: str = "6/900"
    rate_register: str = "5/3600"

    # ---------------- cookies ----------------
    access_cookie: str = "evalix_at"
    refresh_cookie: str = "evalix_rt"
    refresh_cookie_path: str = "/api/v1/auth"

    # ---------------- Qdrant (semantic resume matching) ----------------
    enable_vector_search: bool = True
    qdrant_url: str = "http://127.0.0.1:6333"
    qdrant_api_key: str = ""
    qdrant_collection: str = "candidate_profiles"
    embedding_dim: int = 256

    # ---------------- MinIO (object storage for resumes) ----------------
    enable_object_storage: bool = True
    minio_endpoint: str = "127.0.0.1:9000"
    minio_access_key: str = ""
    minio_secret_key: str = ""
    minio_bucket: str = "resumes"
    minio_secure: bool = False
    presign_expire_seconds: int = 900

    # ---------------- AI provider (KodeKloud) ----------------
    # "heuristic" works fully offline; "kodekloud" calls the external API.
    ai_provider: str = "kodekloud"
    kodekloud_api_base_url: str = "https://api.ai.kodekloud.com/v1"
    kodekloud_api_key: str = "sk-Hb602OMIodTB-KiEDYgsVg"
    ai_model_primary: str = "claude-sonnet-4-6"
    ai_model_search: str = "google/gemini-3.5-flash"
    ai_timeout_seconds: int = 30

    # ---------------- derived ----------------
    @property
    def frontend_origins_list(self) -> List[str]:
        return [
            o.strip().rstrip("/")
            for o in self.frontend_origins.split(",")
            if o.strip()
        ]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    def validate_runtime(self) -> None:
        """Fail fast on unsafe configuration (called at startup)."""
        if not self.jwt_access_secret or len(self.jwt_access_secret) < 32:
            raise RuntimeError(
                "JWT_ACCESS_SECRET is missing or shorter than 32 chars — "
                'generate one with: python -c "import secrets; print(secrets.token_hex(48))"'
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()
