from __future__ import annotations

import json

from pydantic import ValidationError

from app.core.config import Settings
from app.core.errors import UnifiedApiError
from app.schemas.translation import CheckRequest, CheckResult
from app.services.dify_client import DifyClient
from app.services.dify_utils import strip_markdown_json_block


class CheckService:
    def __init__(self, settings: Settings, dify_client: DifyClient) -> None:
        self._settings = settings
        self._dify_client = dify_client

    async def check_translation(self, request: CheckRequest) -> CheckResult:
        result = await self._dify_client.chat(
            api_key=self._settings.dify_check_api_key,
            inputs={
                "direction": request.direction,
                "source_text": request.source_text,
                "target_text": request.target_text,
            },
            query=request.target_text,
            user_id=request.user_id,
        )
        cleaned = strip_markdown_json_block(result.answer)

        try:
            payload = json.loads(cleaned)
            result = CheckResult.model_validate(
                {
                    **payload,
                    "direction": request.direction,
                    "source_text": request.source_text,
                    "target_text": request.target_text,
                }
            )
        except (TypeError, ValueError, ValidationError) as exc:
            raise UnifiedApiError(
                502,
                "DIFY_CHECK_JSON_PARSE_ERROR",
                "Dify check response is not valid JSON.",
            ) from exc

        return result
