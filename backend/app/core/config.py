from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _read_csv(value: str) -> tuple[str, ...]:
    if not value.strip():
        return ()
    return tuple(item.strip() for item in value.split(",") if item.strip())


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    wechat_app_id: str | None = Field(default=None, validation_alias="PURETRANS_WECHAT_APP_ID")
    wechat_app_secret: str | None = Field(default=None, validation_alias="PURETRANS_WECHAT_APP_SECRET")
    auth_state_signing_key: str | None = Field(
        default=None,
        validation_alias="PURETRANS_AUTH_STATE_SIGNING_KEY",
    )
    session_signing_key: str | None = Field(
        default=None,
        validation_alias="PURETRANS_SESSION_SIGNING_KEY",
    )
    session_ttl_seconds: int = Field(default=7200, validation_alias="PURETRANS_SESSION_TTL_SECONDS")
    cors_origins_raw: str = Field(default="", validation_alias="PURETRANS_CORS_ORIGINS")
    auth_state_ttl_seconds: int = 300

    dify_base_url: str = Field(default="https://api.dify.ai/v1", validation_alias="DIFY_BASE_URL")
    dify_kb_translate_api_key: str | None = Field(
        default=None,
        validation_alias="DIFY_KB_TRANSLATE_API_KEY",
    )
    dify_direct_translate_api_key: str | None = Field(
        default=None,
        validation_alias="DIFY_DIRECT_TRANSLATE_API_KEY",
    )
    dify_check_api_key: str | None = Field(default=None, validation_alias="DIFY_CHECK_API_KEY")
    dify_timeout_seconds: float = Field(default=30.0, gt=0, validation_alias="DIFY_TIMEOUT_SECONDS")
    app_env: str = Field(default="development", validation_alias="APP_ENV")
    log_level: str = Field(default="INFO", validation_alias="LOG_LEVEL")

    @field_validator(
        "wechat_app_id",
        "wechat_app_secret",
        "auth_state_signing_key",
        "session_signing_key",
        "dify_kb_translate_api_key",
        "dify_direct_translate_api_key",
        "dify_check_api_key",
        mode="before",
    )
    @classmethod
    def blank_to_none(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @property
    def cors_origins(self) -> tuple[str, ...]:
        return _read_csv(self.cors_origins_raw)

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
    return Settings()
