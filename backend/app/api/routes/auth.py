from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends, Header

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.schemas.auth import (
    AuthSessionResponse,
    WeChatChallengeResponse,
    WeChatExchangeRequest,
    WeChatExchangeResponse,
)
from app.services.wechat_auth_service import WeChatAuthService
from app.services.wechat_client import WeChatClient


router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_wechat_client(settings: Settings = Depends(get_settings)) -> WeChatClient:
    return WeChatClient(settings)


def get_wechat_auth_service(
    settings: Settings = Depends(get_settings),
    wechat_client: WeChatClient = Depends(get_wechat_client),
) -> WeChatAuthService:
    return WeChatAuthService(settings=settings, wechat_client=wechat_client)


def get_bearer_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization:
        raise AppError(401, "session_invalid", "Authorization header is required.")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise AppError(401, "session_invalid", "Authorization header must use a bearer token.")

    return token


@router.post("/wechat/challenge", response_model=WeChatChallengeResponse)
async def create_wechat_challenge(
    auth_service: WeChatAuthService = Depends(get_wechat_auth_service),
) -> WeChatChallengeResponse:
    result = auth_service.create_challenge()
    return WeChatChallengeResponse(
        requestId=uuid4().hex,
        challengeId=result.challenge_id,
        wechatAppId=result.wechat_app_id,
        scope=result.scope,
        state=result.state,
        expiresAt=result.expires_at,
    )


@router.post("/wechat/exchange", response_model=WeChatExchangeResponse)
async def exchange_wechat_code(
    payload: WeChatExchangeRequest,
    auth_service: WeChatAuthService = Depends(get_wechat_auth_service),
) -> WeChatExchangeResponse:
    result = await auth_service.exchange_code(
        challenge_id=payload.challenge_id,
        code=payload.code,
        state=payload.state,
    )
    return WeChatExchangeResponse(
        requestId=uuid4().hex,
        session=result.session,
        user=result.user,
    )


@router.get("/session", response_model=AuthSessionResponse)
async def get_auth_session(
    token: str = Depends(get_bearer_token),
    auth_service: WeChatAuthService = Depends(get_wechat_auth_service),
) -> AuthSessionResponse:
    result = auth_service.get_session(token)
    return AuthSessionResponse(
        requestId=uuid4().hex,
        session=result.session,
        user=result.user,
    )
