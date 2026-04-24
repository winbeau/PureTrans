from __future__ import annotations

from base64 import urlsafe_b64decode, urlsafe_b64encode
from dataclasses import dataclass
from datetime import UTC, datetime
import hashlib
import hmac
import json
import secrets
import time

from app.core.config import Settings
from app.core.errors import AppError


def _b64encode(value: bytes) -> str:
    return urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return urlsafe_b64decode(f"{value}{padding}".encode("ascii"))


def _utc_from_timestamp(timestamp: int) -> datetime:
    return datetime.fromtimestamp(timestamp, UTC)


def _isoformat_z(value: datetime) -> str:
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


@dataclass(frozen=True)
class AuthStatePayload:
    challenge_id: str
    scope: str
    app_id: str
    expires_at: datetime


@dataclass(frozen=True)
class SessionToken:
    token: str
    expires_at: datetime


@dataclass(frozen=True)
class SessionTokenPayload:
    open_id: str
    union_id: str | None
    nickname: str
    avatar_url: str | None
    province: str | None
    city: str | None
    country: str | None
    expires_at: datetime


class _SignedTokenCodec:
    def __init__(self, signing_key: str) -> None:
        self._signing_key = signing_key.encode("utf-8")

    def encode(self, payload: dict[str, object]) -> str:
        payload_bytes = json.dumps(
            payload,
            separators=(",", ":"),
            sort_keys=True,
        ).encode("utf-8")
        encoded_payload = _b64encode(payload_bytes)
        signature = hmac.new(
            self._signing_key,
            encoded_payload.encode("ascii"),
            hashlib.sha256,
        ).digest()
        return f"{encoded_payload}.{_b64encode(signature)}"

    def decode(self, token: str) -> dict[str, object]:
        try:
            encoded_payload, encoded_signature = token.split(".", 1)
        except ValueError as exc:
            raise AppError(400, "auth_state_invalid", "Invalid signed token.") from exc

        expected_signature = hmac.new(
            self._signing_key,
            encoded_payload.encode("ascii"),
            hashlib.sha256,
        ).digest()

        if not hmac.compare_digest(_b64encode(expected_signature), encoded_signature):
            raise AppError(400, "auth_state_invalid", "Signed token validation failed.")

        try:
            payload = json.loads(_b64decode(encoded_payload))
        except (json.JSONDecodeError, ValueError) as exc:
            raise AppError(400, "auth_state_invalid", "Signed token payload is invalid.") from exc

        if not isinstance(payload, dict):
            raise AppError(400, "auth_state_invalid", "Signed token payload is invalid.")

        return payload


class AuthStateSigner:
    def __init__(self, settings: Settings) -> None:
        if not settings.auth_state_signing_key:
            raise AppError(503, "auth_not_configured", "Auth signing is not configured.")
        if not settings.wechat_app_id:
            raise AppError(503, "auth_not_configured", "WeChat auth is not configured.")
        self._settings = settings
        self._codec = _SignedTokenCodec(settings.auth_state_signing_key)

    def issue(self, challenge_id: str, scope: str, now: int | None = None) -> str:
        issued_at = int(time.time() if now is None else now)
        expires_at = issued_at + self._settings.auth_state_ttl_seconds
        payload = {
            "app_id": self._settings.wechat_app_id,
            "challenge_id": challenge_id,
            "exp": expires_at,
            "nonce": secrets.token_urlsafe(8),
            "scope": scope,
        }
        return self._codec.encode(payload)

    def verify(self, token: str, now: int | None = None) -> AuthStatePayload:
        payload = self._codec.decode(token)
        expires_at = int(payload.get("exp", 0))
        current_time = int(time.time() if now is None else now)
        if expires_at <= current_time:
            raise AppError(400, "auth_state_invalid", "State token has expired.")

        challenge_id = payload.get("challenge_id")
        scope = payload.get("scope")
        app_id = payload.get("app_id")
        if not isinstance(challenge_id, str) or not isinstance(scope, str) or not isinstance(app_id, str):
            raise AppError(400, "auth_state_invalid", "State token payload is invalid.")

        return AuthStatePayload(
            challenge_id=challenge_id,
            scope=scope,
            app_id=app_id,
            expires_at=_utc_from_timestamp(expires_at),
        )


class SessionSigner:
    def __init__(self, settings: Settings) -> None:
        if not settings.session_signing_key:
            raise AppError(503, "auth_not_configured", "Session signing is not configured.")
        self._settings = settings
        self._codec = _SignedTokenCodec(settings.session_signing_key)

    def issue(
        self,
        open_id: str,
        nickname: str,
        *,
        union_id: str | None = None,
        avatar_url: str | None = None,
        province: str | None = None,
        city: str | None = None,
        country: str | None = None,
        now: int | None = None,
    ) -> SessionToken:
        issued_at = int(time.time() if now is None else now)
        expires_at = issued_at + self._settings.session_ttl_seconds
        token = self._codec.encode(
            {
                "exp": expires_at,
                "open_id": open_id,
                "union_id": union_id,
                "nickname": nickname,
                "avatar_url": avatar_url,
                "province": province,
                "city": city,
                "country": country,
                "type": "puretrans_session",
            }
        )
        return SessionToken(token=token, expires_at=_utc_from_timestamp(expires_at))

    def verify(self, token: str, now: int | None = None) -> SessionTokenPayload:
        try:
            payload = self._codec.decode(token)
        except AppError as exc:
            raise AppError(401, "session_invalid", "Session token is invalid.") from exc

        expires_at = int(payload.get("exp", 0))
        current_time = int(time.time() if now is None else now)
        if expires_at <= current_time:
            raise AppError(401, "session_invalid", "Session token has expired.")

        open_id = payload.get("open_id")
        nickname = payload.get("nickname")
        token_type = payload.get("type")
        if not isinstance(open_id, str) or not isinstance(nickname, str) or token_type != "puretrans_session":
            raise AppError(401, "session_invalid", "Session token payload is invalid.")

        return SessionTokenPayload(
            open_id=open_id,
            union_id=payload.get("union_id") if isinstance(payload.get("union_id"), str) else None,
            nickname=nickname,
            avatar_url=payload.get("avatar_url") if isinstance(payload.get("avatar_url"), str) else None,
            province=payload.get("province") if isinstance(payload.get("province"), str) else None,
            city=payload.get("city") if isinstance(payload.get("city"), str) else None,
            country=payload.get("country") if isinstance(payload.get("country"), str) else None,
            expires_at=_utc_from_timestamp(expires_at),
        )


__all__ = [
    "AuthStatePayload",
    "AuthStateSigner",
    "SessionSigner",
    "SessionToken",
    "SessionTokenPayload",
    "_isoformat_z",
]
