from __future__ import annotations

import httpx
from fastapi.testclient import TestClient

from app.main import create_app


def test_compare_returns_kb_and_direct_translations(dify_env: None, respx_mock) -> None:
    route = respx_mock.post("https://dify.test/v1/chat-messages").mock(
        side_effect=[
            httpx.Response(200, json={"answer": "Hello Xinjiang"}),
            httpx.Response(200, json={"answer": "Hello"}),
        ]
    )
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/translate/compare",
        json={"direction": "中英", "source_text": "新疆你好"},
    )

    assert response.status_code == 200
    assert response.json()["data"] == {
        "direction": "中英",
        "source_text": "新疆你好",
        "kb_translation": {
            "direction": "中英",
            "source_text": "新疆你好",
            "translated_text": "Hello Xinjiang",
            "mode": "kb",
            "citations": [],
        },
        "direct_translation": {
            "direction": "中英",
            "source_text": "新疆你好",
            "translated_text": "Hello",
            "mode": "direct",
            "citations": [],
        },
    }
    assert len(route.calls) == 2
    assert route.calls[0].request.headers["authorization"] == "Bearer kb-key"
    assert route.calls[1].request.headers["authorization"] == "Bearer direct-key"
