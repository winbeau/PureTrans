from __future__ import annotations

import json

import httpx
from fastapi.testclient import TestClient

from app.main import create_app


def test_translate_direct_uses_direct_dify_key(dify_env: None, respx_mock) -> None:
    route = respx_mock.post("https://dify.test/v1/chat-messages").mock(
        return_value=httpx.Response(200, json={"answer": "Hello"})
    )
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/translate/direct",
        json={"direction": "中英", "source_text": "你好"},
    )

    assert response.status_code == 200
    assert response.json()["data"] == {
        "direction": "中英",
        "source_text": "你好",
        "translated_text": "Hello",
        "mode": "direct",
        "citations": [],
    }
    request = route.calls[0].request
    assert request.headers["authorization"] == "Bearer direct-key"
    assert json.loads(request.content)["user"] == "android-user"
