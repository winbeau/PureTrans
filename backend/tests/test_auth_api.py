from __future__ import annotations

from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient

from app.api.routes.auth import get_wechat_client
from app.core.config import get_settings
from app.core.security import AuthStateSigner
from app.main import create_app
from app.services.wechat_client import WeChatAccessToken, WeChatUserInfo


@dataclass
class StubWeChatClient:
    access_token: WeChatAccessToken
    user_info: WeChatUserInfo

    async def exchange_code(self, code: str) -> WeChatAccessToken:
        assert code == "wechat-code"
        return self.access_token

    async def get_user_info(self, access_token: str, open_id: str) -> WeChatUserInfo:
        assert access_token == self.access_token.access_token
        assert open_id == self.access_token.open_id
        return self.user_info


@pytest.fixture(autouse=True)
def clear_settings_cache() -> None:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def configured_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PURETRANS_WECHAT_APP_ID", "wx-test-app")
    monkeypatch.setenv("PURETRANS_WECHAT_APP_SECRET", "wechat-secret")
    monkeypatch.setenv("PURETRANS_AUTH_STATE_SIGNING_KEY", "state-signing-key")
    monkeypatch.setenv("PURETRANS_SESSION_SIGNING_KEY", "session-signing-key")
    monkeypatch.setenv("PURETRANS_SESSION_TTL_SECONDS", "7200")
    monkeypatch.setenv("PURETRANS_CORS_ORIGINS", "http://localhost:5173")


def test_challenge_returns_signed_state(configured_env: None) -> None:
    client = TestClient(create_app())

    response = client.post("/api/auth/wechat/challenge")

    assert response.status_code == 200
    data = response.json()
    assert data["wechatAppId"] == "wx-test-app"
    assert data["scope"] == "snsapi_userinfo"
    assert data["challengeId"]
    assert data["requestId"]
    assert data["state"]
    assert data["expiresAt"].endswith("Z")

    signer = AuthStateSigner(get_settings())
    payload = signer.verify(data["state"])

    assert payload.challenge_id == data["challengeId"]
    assert payload.scope == data["scope"]
    assert payload.app_id == data["wechatAppId"]


def test_exchange_rejects_tampered_or_expired_state(configured_env: None) -> None:
    client = TestClient(create_app())
    challenge_response = client.post("/api/auth/wechat/challenge")
    challenge = challenge_response.json()

    tampered_state = f"{challenge['state']}tampered"
    tampered_response = client.post(
        "/api/auth/wechat/exchange",
        json={
            "challengeId": challenge["challengeId"],
            "code": "wechat-code",
            "state": tampered_state,
        },
    )

    assert tampered_response.status_code == 400
    assert tampered_response.json()["error"]["code"] == "auth_state_invalid"

    signer = AuthStateSigner(get_settings())
    expired_state = signer.issue(challenge["challengeId"], "snsapi_userinfo", now=0)
    expired_response = client.post(
        "/api/auth/wechat/exchange",
        json={
            "challengeId": challenge["challengeId"],
            "code": "wechat-code",
            "state": expired_state,
        },
    )

    assert expired_response.status_code == 400
    assert expired_response.json()["error"]["code"] == "auth_state_invalid"


def test_exchange_returns_normalized_user_and_session(configured_env: None) -> None:
    app = create_app()
    client = TestClient(app)

    app.dependency_overrides[get_wechat_client] = lambda: StubWeChatClient(
        access_token=WeChatAccessToken(
            access_token="access-token",
            open_id="wechat-open-id",
            union_id="wechat-union-id",
        ),
        user_info=WeChatUserInfo(
            open_id="wechat-open-id",
            union_id="wechat-union-id",
            nickname="清译用户",
            avatar_url="https://example.com/avatar.png",
            province="Xinjiang",
            city="Urumqi",
            country="CN",
        ),
    )

    challenge_response = client.post("/api/auth/wechat/challenge")
    challenge = challenge_response.json()
    response = client.post(
        "/api/auth/wechat/exchange",
        json={
            "challengeId": challenge["challengeId"],
            "code": "wechat-code",
            "state": challenge["state"],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["requestId"]
    assert data["session"]["token"]
    assert data["session"]["expiresAt"].endswith("Z")
    assert data["user"] == {
        "openId": "wechat-open-id",
        "unionId": "wechat-union-id",
        "nickname": "清译用户",
        "avatarUrl": "https://example.com/avatar.png",
        "province": "Xinjiang",
        "city": "Urumqi",
        "country": "CN",
    }

    session_response = client.get(
        "/api/auth/session",
        headers={"Authorization": f"Bearer {data['session']['token']}"},
    )

    assert session_response.status_code == 200
    assert session_response.json()["user"] == data["user"]
    assert session_response.json()["session"] == data["session"]


def test_challenge_returns_503_when_wechat_is_not_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PURETRANS_AUTH_STATE_SIGNING_KEY", "state-signing-key")
    monkeypatch.setenv("PURETRANS_SESSION_SIGNING_KEY", "session-signing-key")
    monkeypatch.setenv("PURETRANS_SESSION_TTL_SECONDS", "7200")
    monkeypatch.setenv("PURETRANS_CORS_ORIGINS", "http://localhost:5173")

    client = TestClient(create_app())
    response = client.post("/api/auth/wechat/challenge")

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "auth_not_configured"
