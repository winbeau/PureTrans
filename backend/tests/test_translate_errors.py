from __future__ import annotations

import httpx
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app


def test_invalid_direction_returns_unified_validation_error(dify_env: None) -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/translate/direct",
        json={"direction": "法中", "source_text": "bonjour"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert response.json()["error"]["requestId"]
    assert response.json()["success"] is False


def test_empty_source_text_fails_validation(dify_env: None) -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/translate/direct",
        json={"direction": "中英", "source_text": "   "},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_empty_target_text_fails_validation(dify_env: None) -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/check",
        json={"direction": "中英", "source_text": "你好", "target_text": "   "},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_dify_timeout_returns_unified_error(dify_env: None, respx_mock) -> None:
    respx_mock.post("https://dify.test/v1/chat-messages").mock(
        side_effect=httpx.TimeoutException("timed out")
    )
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/translate/direct",
        json={"direction": "中英", "source_text": "你好"},
    )

    assert response.status_code == 504
    assert response.json()["error"]["code"] == "DIFY_TIMEOUT"


def test_dify_500_returns_unified_error(dify_env: None, respx_mock) -> None:
    respx_mock.post("https://dify.test/v1/chat-messages").mock(
        return_value=httpx.Response(500, json={"message": "provider failed"})
    )
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/translate/direct",
        json={"direction": "中英", "source_text": "你好"},
    )

    assert response.status_code == 502
    assert response.json()["error"]["code"] == "DIFY_HTTP_ERROR"


def test_missing_answer_returns_bad_response(dify_env: None, respx_mock) -> None:
    respx_mock.post("https://dify.test/v1/chat-messages").mock(
        return_value=httpx.Response(200, json={"event": "message"})
    )
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/translate/direct",
        json={"direction": "中英", "source_text": "你好"},
    )

    assert response.status_code == 502
    assert response.json()["error"]["code"] == "DIFY_BAD_RESPONSE"


def test_dify_invalid_json_returns_bad_response(dify_env: None, respx_mock) -> None:
    respx_mock.post("https://dify.test/v1/chat-messages").mock(
        return_value=httpx.Response(200, content=b"not-json")
    )
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/translate/direct",
        json={"direction": "中英", "source_text": "你好"},
    )

    assert response.status_code == 502
    assert response.json()["error"]["code"] == "DIFY_BAD_RESPONSE"


def test_missing_dify_api_key_returns_configuration_error(
    monkeypatch, dify_env: None
) -> None:
    monkeypatch.setenv("DIFY_DIRECT_TRANSLATE_API_KEY", "")
    get_settings.cache_clear()
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/translate/direct",
        json={"direction": "中英", "source_text": "你好"},
    )

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "SERVER_CONFIG_ERROR"
    assert response.json()["error"]["message"] == "Translation service is not configured."
    assert response.json()["error"]["requestId"]
