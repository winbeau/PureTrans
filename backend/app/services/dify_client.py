from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Any

import httpx

from app.core.config import Settings
from app.core.errors import UnifiedApiError
from app.schemas.translation import RagCitation


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class DifyChatResult:
    answer: str
    citations: list[RagCitation]


class DifyClient:
    def __init__(self, settings: Settings) -> None:
        self._base_url = settings.dify_base_url.rstrip("/")
        self._timeout = settings.dify_timeout_seconds

    async def chat(
        self,
        *,
        api_key: str | None,
        inputs: dict[str, Any],
        query: str,
        user_id: str,
    ) -> DifyChatResult:
        if not api_key:
            raise UnifiedApiError(503, "SERVER_CONFIG_ERROR", "Translation service is not configured.")

        url = f"{self._base_url}/chat-messages"
        payload = {
            "inputs": inputs,
            "query": query,
            "response_mode": "blocking",
            "conversation_id": "",
            "user": user_id,
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(
                    url,
                    headers={"Authorization": f"Bearer {api_key}"},
                    json=payload,
                )
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            logger.warning("Dify request timed out: url=%s", url)
            raise UnifiedApiError(504, "DIFY_TIMEOUT", "Dify request timed out.") from exc
        except httpx.HTTPStatusError as exc:
            logger.warning(
                "Dify request failed: url=%s status=%s response=%s",
                url,
                exc.response.status_code,
                _safe_response_preview(exc.response),
            )
            raise UnifiedApiError(502, "DIFY_HTTP_ERROR", "Dify request failed.") from exc
        except httpx.HTTPError as exc:
            logger.warning("Dify request failed before response: url=%s error=%s", url, type(exc).__name__)
            raise UnifiedApiError(502, "DIFY_HTTP_ERROR", "Dify request failed.") from exc

        try:
            data = response.json()
        except ValueError as exc:
            logger.warning("Dify response is not JSON: url=%s response=%s", url, _safe_response_preview(response))
            raise UnifiedApiError(502, "DIFY_BAD_RESPONSE", "Dify response is not valid JSON.") from exc

        if not isinstance(data, dict) or not isinstance(data.get("answer"), str):
            logger.warning(
                "Dify response missing answer: url=%s keys=%s",
                url,
                sorted(data.keys()) if isinstance(data, dict) else type(data).__name__,
            )
            raise UnifiedApiError(502, "DIFY_BAD_RESPONSE", "Dify response is missing an answer.")

        return DifyChatResult(answer=data["answer"], citations=_extract_citations(data))


def _safe_response_preview(response: httpx.Response) -> str:
    text = response.text.replace("\n", " ").strip()
    if len(text) > 300:
        return f"{text[:300]}..."
    return text


def _extract_citations(data: dict[str, Any]) -> list[RagCitation]:
    metadata = data.get("metadata")
    if not isinstance(metadata, dict):
        return []

    resources = metadata.get("retriever_resources")
    if not isinstance(resources, list):
        return []

    citations: list[RagCitation] = []
    for resource in resources:
        if not isinstance(resource, dict):
            continue

        source_id = _first_string(resource, "source_id", "segment_id", "document_id", "dataset_id", "id")
        snippet = _first_string(resource, "snippet", "content", "text")
        if not source_id or snippet is None:
            continue

        score = resource.get("score")
        citations.append(
            RagCitation(
                source_id=source_id,
                title=_first_string(resource, "title", "document_name", "dataset_name"),
                snippet=snippet,
                relevance_score=float(score) if isinstance(score, (int, float)) else None,
                knowledge_domain=_first_string(resource, "knowledge_domain", "domain", "dataset_name"),
                retrieved_at=_first_string(resource, "retrieved_at", "retrieval_timestamp", "version"),
            )
        )

    return citations


def _first_string(data: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None
