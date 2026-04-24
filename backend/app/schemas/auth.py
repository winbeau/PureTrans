from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class AppBaseModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class ErrorDetail(AppBaseModel):
    code: str
    message: str


class ErrorResponse(AppBaseModel):
    request_id: str = Field(alias="requestId")
    error: ErrorDetail


class WeChatChallengeResponse(AppBaseModel):
    request_id: str = Field(alias="requestId")
    challenge_id: str = Field(alias="challengeId")
    wechat_app_id: str = Field(alias="wechatAppId")
    scope: str
    state: str
    expires_at: str = Field(alias="expiresAt")


class WeChatExchangeRequest(AppBaseModel):
    challenge_id: str = Field(alias="challengeId")
    code: str
    state: str


class AuthenticatedSession(AppBaseModel):
    token: str
    expires_at: str = Field(alias="expiresAt")


class AuthenticatedUser(AppBaseModel):
    open_id: str = Field(alias="openId")
    union_id: str | None = Field(default=None, alias="unionId")
    nickname: str
    avatar_url: str | None = Field(default=None, alias="avatarUrl")
    province: str | None = None
    city: str | None = None
    country: str | None = None


class WeChatExchangeResponse(AppBaseModel):
    request_id: str = Field(alias="requestId")
    session: AuthenticatedSession
    user: AuthenticatedUser


class AuthSessionResponse(AppBaseModel):
    request_id: str = Field(alias="requestId")
    session: AuthenticatedSession
    user: AuthenticatedUser


class HealthResponse(AppBaseModel):
    request_id: str = Field(alias="requestId")
    status: str
    wechat_configured: bool = Field(alias="wechatConfigured")
