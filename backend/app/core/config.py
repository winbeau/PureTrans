from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import os


def _read_csv_env(name: str) -> tuple[str, ...]:
    value = os.getenv(name, "")
    if not value.strip():
        return ()
    return tuple(item.strip() for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    wechat_app_id: str | None
    wechat_app_secret: str | None
    auth_state_signing_key: str | None
    session_signing_key: str | None
    session_ttl_seconds: int
    cors_origins: tuple[str, ...]
    auth_state_ttl_seconds: int = 300

    @property
    def wechat_configured(self) -> bool:
        return bool(self.wechat_app_id and self.wechat_app_secret)

    @property
    def auth_configured(self) -> bool:
        return bool(
            self.wechat_configured
            and self.auth_state_signing_key
            and self.session_signing_key
        )


@lru_cache
def get_settings() -> Settings:
    return Settings(
        wechat_app_id=os.getenv("PURETRANS_WECHAT_APP_ID") or None,
        wechat_app_secret=os.getenv("PURETRANS_WECHAT_APP_SECRET") or None,
        auth_state_signing_key=os.getenv("PURETRANS_AUTH_STATE_SIGNING_KEY") or None,
        session_signing_key=os.getenv("PURETRANS_SESSION_SIGNING_KEY") or None,
        session_ttl_seconds=int(os.getenv("PURETRANS_SESSION_TTL_SECONDS", "7200")),
        cors_origins=_read_csv_env("PURETRANS_CORS_ORIGINS"),
    )
