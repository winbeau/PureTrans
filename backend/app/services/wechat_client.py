from __future__ import annotations

from dataclasses import dataclass

import httpx

from app.core.config import Settings
from app.core.errors import AppError


WECHAT_OAUTH_URL = "https://api.weixin.qq.com/sns/oauth2/access_token"
WECHAT_USERINFO_URL = "https://api.weixin.qq.com/sns/userinfo"


@dataclass(frozen=True)
class WeChatAccessToken:
    access_token: str
    open_id: str
    union_id: str | None = None


@dataclass(frozen=True)
class WeChatUserInfo:
    open_id: str
    union_id: str | None
    nickname: str
    avatar_url: str | None
    province: str | None
    city: str | None
    country: str | None


class WeChatClient:
    def __init__(self, settings: Settings, http_client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._http_client = http_client or httpx.AsyncClient(timeout=10.0)

    async def exchange_code(self, code: str) -> WeChatAccessToken:
        if not self._settings.wechat_app_id or not self._settings.wechat_app_secret:
            raise AppError(503, "auth_not_configured", "WeChat auth is not configured.")

        response = await self._http_client.get(
            WECHAT_OAUTH_URL,
            params={
                "appid": self._settings.wechat_app_id,
                "secret": self._settings.wechat_app_secret,
                "code": code,
                "grant_type": "authorization_code",
            },
        )
        data = self._parse_response(response, "wechat_exchange_failed")
        access_token = data.get("access_token")
        open_id = data.get("openid")
        union_id = data.get("unionid")
        if not isinstance(access_token, str) or not isinstance(open_id, str):
            raise AppError(502, "wechat_exchange_failed", "WeChat exchange response is incomplete.")
        return WeChatAccessToken(
            access_token=access_token,
            open_id=open_id,
            union_id=union_id if isinstance(union_id, str) else None,
        )

    async def get_user_info(self, access_token: str, open_id: str) -> WeChatUserInfo:
        response = await self._http_client.get(
            WECHAT_USERINFO_URL,
            params={
                "access_token": access_token,
                "openid": open_id,
                "lang": "zh_CN",
            },
        )
        data = self._parse_response(response, "wechat_userinfo_failed")
        returned_open_id = data.get("openid")
        nickname = data.get("nickname")
        if not isinstance(returned_open_id, str) or not isinstance(nickname, str):
            raise AppError(502, "wechat_userinfo_failed", "WeChat user profile response is incomplete.")
        return WeChatUserInfo(
            open_id=returned_open_id,
            union_id=data.get("unionid") if isinstance(data.get("unionid"), str) else None,
            nickname=nickname,
            avatar_url=data.get("headimgurl") if isinstance(data.get("headimgurl"), str) else None,
            province=data.get("province") if isinstance(data.get("province"), str) else None,
            city=data.get("city") if isinstance(data.get("city"), str) else None,
            country=data.get("country") if isinstance(data.get("country"), str) else None,
        )

    def _parse_response(self, response: httpx.Response, error_code: str) -> dict[str, object]:
        try:
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise AppError(502, error_code, "WeChat request failed.") from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise AppError(502, error_code, "WeChat response is not valid JSON.") from exc

        if not isinstance(payload, dict):
            raise AppError(502, error_code, "WeChat response has an invalid payload.")

        errcode = payload.get("errcode")
        if errcode not in (None, 0):
            raise AppError(502, error_code, str(payload.get("errmsg") or "WeChat request failed."))

        return payload
