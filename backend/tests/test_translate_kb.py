from __future__ import annotations

import json

import httpx
from fastapi.testclient import TestClient

from app.main import create_app


def test_translate_kb_uses_kb_dify_key(dify_env: None, respx_mock) -> None:
    route = respx_mock.post("https://dify.test/v1/chat-messages").mock(
        return_value=httpx.Response(
            200,
            json={
                "answer": "Hello Xinjiang",
                "metadata": {
                    "retriever_resources": [
                        {
                            "segment_id": "seg-1",
                            "document_name": "新疆地名术语表",
                            "content": "新疆 should be translated as Xinjiang in official contexts.",
                            "score": 0.91,
                            "dataset_name": "xinjiang-local",
                        }
                    ]
                },
            },
        )
    )
    client = TestClient(create_app())

    response = client.post(
        "/api/v1/translate/kb",
        json={"direction": "中英", "source_text": "新疆你好", "user_id": "android-1"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "success": True,
        "data": {
            "direction": "中英",
            "source_text": "新疆你好",
            "translated_text": "Hello Xinjiang",
            "mode": "kb",
            "citations": [
                {
                    "source_id": "seg-1",
                    "title": "新疆地名术语表",
                    "snippet": "新疆 should be translated as Xinjiang in official contexts.",
                    "relevance_score": 0.91,
                    "knowledge_domain": "xinjiang-local",
                    "retrieved_at": None,
                }
            ],
        },
        "error": None,
    }
    assert route.called
    request = route.calls[0].request
    assert request.headers["authorization"] == "Bearer kb-key"
    payload = json.loads(request.content)
    assert payload["response_mode"] == "blocking"
    assert payload["conversation_id"] == ""
    assert payload["query"] == "新疆你好"
    assert payload["user"] == "android-1"
    assert payload["inputs"]["direction"] == "中英"
