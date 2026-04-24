from __future__ import annotations

import httpx
from fastapi.testclient import TestClient

from app.main import create_app


CHECK_ANSWER = (
    '{"issues":[{"type":"terminology","severity":"medium","message":"术语不稳定",'
    '"suggestion":"使用固定译名"}],"revised_text":"Hello Xinjiang"}'
)


def test_check_parses_json_string_answer(dify_env: None, respx_mock) -> None:
    respx_mock.post("https://dify.test/v1/chat-messages").mock(
        return_value=httpx.Response(200, json={"answer": CHECK_ANSWER})
    )
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/check",
        json={
            "direction": "中英",
            "source_text": "新疆你好",
            "target_text": "Hello Sinkiang",
        },
    )

    assert response.status_code == 200
    assert response.json()["data"] == {
        "direction": "中英",
        "source_text": "新疆你好",
        "target_text": "Hello Sinkiang",
        "issues": [
            {
                "type": "terminology",
                "severity": "medium",
                "message": "术语不稳定",
                "suggestion": "使用固定译名",
            }
        ],
        "revised_text": "Hello Xinjiang",
    }


def test_check_parses_fenced_markdown_json_answer(dify_env: None, respx_mock) -> None:
    respx_mock.post("https://dify.test/v1/chat-messages").mock(
        return_value=httpx.Response(200, json={"answer": f"```json\n{CHECK_ANSWER}\n```"})
    )
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/check",
        json={
            "direction": "中英",
            "source_text": "新疆你好",
            "target_text": "Hello Sinkiang",
        },
    )

    assert response.status_code == 200
    assert response.json()["data"]["revised_text"] == "Hello Xinjiang"
    assert response.json()["data"]["issues"][0]["type"] == "terminology"


def test_check_invalid_json_returns_parse_error(dify_env: None, respx_mock) -> None:
    respx_mock.post("https://dify.test/v1/chat-messages").mock(
        return_value=httpx.Response(200, json={"answer": "not-json"})
    )
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/check",
        json={
            "direction": "中英",
            "source_text": "新疆你好",
            "target_text": "Hello Sinkiang",
        },
    )

    assert response.status_code == 502
    assert response.json()["success"] is False
    assert response.json()["data"] is None
    assert response.json()["error"]["code"] == "DIFY_CHECK_JSON_PARSE_ERROR"
    assert response.json()["error"]["message"] == "Dify check response is not valid JSON."
    assert response.json()["error"]["requestId"]
