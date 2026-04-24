from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4

from app.core.config import Settings
from app.core.errors import AppError
from app.core.security import AuthStateSigner, SessionSigner, _isoformat_z
from app.schemas.auth import AuthenticatedSession, AuthenticatedUser
from app.services.wechat_client import WeChatClient


WECHAT_SCOPE = "snsapi_userinfo"


@dataclass(frozen=True)
class ChallengeResult:
    challenge_id: str
    wechat_app_id: str
    scope: str
    state: str
    expires_at: str


@dataclass(frozen=True)
class ExchangeResult:
    session: AuthenticatedSession
    user: AuthenticatedUser


class WeChatAuthService:
    def __init__(self, settings: Settings, wechat_client: WeChatClient) -> None:
        self._settings = settings
        self._wechat_client = wechat_client
        self._state_signer = AuthStateSigner(settings)
        self._session_signer = SessionSigner(settings)

    def create_challenge(self) -> ChallengeResult:
        if not self._settings.auth_configured or not self._settings.wechat_app_id:
            raise AppError(503, "auth_not_configured", "WeChat auth is not configured.")

        challenge_id = uuid4().hex
        state = self._state_signer.issue(challenge_id, WECHAT_SCOPE)
        state_payload = self._state_signer.verify(state)
        return ChallengeResult(
            challenge_id=challenge_id,
            wechat_app_id=self._settings.wechat_app_id,
            scope=WECHAT_SCOPE,
            state=state,
            expires_at=_isoformat_z(state_payload.expires_at),
        )

    async def exchange_code(self, challenge_id: str, code: str, state: str) -> ExchangeResult:
        if not self._settings.auth_configured:
            raise AppError(503, "auth_not_configured", "WeChat auth is not configured.")

        payload = self._state_signer.verify(state)
        if payload.challenge_id != challenge_id or payload.app_id != self._settings.wechat_app_id:
            raise AppError(400, "auth_state_invalid", "WeChat auth state does not match the challenge.")

        access_token = await self._wechat_client.exchange_code(code)
        user_info = await self._wechat_client.get_user_info(
            access_token=access_token.access_token,
            open_id=access_token.open_id,
        )
        session = self._session_signer.issue(
            user_info.open_id,
            user_info.nickname,
            union_id=user_info.union_id or access_token.union_id,
            avatar_url=user_info.avatar_url,
            province=user_info.province,
            city=user_info.city,
            country=user_info.country,
        )

        return ExchangeResult(
            session=AuthenticatedSession(
                token=session.token,
                expiresAt=_isoformat_z(session.expires_at),
            ),
            user=AuthenticatedUser(
                openId=user_info.open_id,
                unionId=user_info.union_id or access_token.union_id,
                nickname=user_info.nickname,
                avatarUrl=user_info.avatar_url,
                province=user_info.province,
                city=user_info.city,
                country=user_info.country,
            ),
        )

    def get_session(self, token: str) -> ExchangeResult:
        payload = self._session_signer.verify(token)
        return ExchangeResult(
            session=AuthenticatedSession(
                token=token,
                expiresAt=_isoformat_z(payload.expires_at),
            ),
            user=AuthenticatedUser(
                openId=payload.open_id,
                unionId=payload.union_id,
                nickname=payload.nickname,
                avatarUrl=payload.avatar_url,
                province=payload.province,
                city=payload.city,
                country=payload.country,
            ),
        )
