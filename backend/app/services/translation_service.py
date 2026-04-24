from __future__ import annotations

from app.core.config import Settings
from app.schemas.translation import (
    CompareTranslationResult,
    TranslationRequest,
    TranslationResult,
)
from app.services.dify_client import DifyClient


class TranslationService:
    def __init__(self, settings: Settings, dify_client: DifyClient) -> None:
        self._settings = settings
        self._dify_client = dify_client

    async def translate_with_kb(self, request: TranslationRequest) -> TranslationResult:
        result = await self._dify_client.chat(
            api_key=self._settings.dify_kb_translate_api_key,
            inputs={"direction": request.direction, "mode": "kb"},
            query=request.source_text,
            user_id=request.user_id,
        )
        return TranslationResult(
            direction=request.direction,
            source_text=request.source_text,
            translated_text=result.answer.strip(),
            mode="kb",
            citations=result.citations,
        )

    async def translate_direct(self, request: TranslationRequest) -> TranslationResult:
        result = await self._dify_client.chat(
            api_key=self._settings.dify_direct_translate_api_key,
            inputs={"direction": request.direction, "mode": "direct"},
            query=request.source_text,
            user_id=request.user_id,
        )
        return TranslationResult(
            direction=request.direction,
            source_text=request.source_text,
            translated_text=result.answer.strip(),
            mode="direct",
            citations=[],
        )

    async def compare_translate(self, request: TranslationRequest) -> CompareTranslationResult:
        kb_translation = await self.translate_with_kb(request)
        direct_translation = await self.translate_direct(request)
        return CompareTranslationResult(
            direction=request.direction,
            source_text=request.source_text,
            kb_translation=kb_translation,
            direct_translation=direct_translation,
        )
