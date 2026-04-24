from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.schemas.api import ApiResponse
from app.schemas.translation import (
    CheckRequest,
    CheckResult,
    CompareTranslationResult,
    TranslationRequest,
    TranslationResult,
)
from app.services.check_service import CheckService
from app.services.dify_client import DifyClient
from app.services.translation_service import TranslationService


router = APIRouter(prefix="/api/v1", tags=["translation"])


def get_dify_client(settings: Settings = Depends(get_settings)) -> DifyClient:
    return DifyClient(settings)


def get_translation_service(
    settings: Settings = Depends(get_settings),
    dify_client: DifyClient = Depends(get_dify_client),
) -> TranslationService:
    return TranslationService(settings=settings, dify_client=dify_client)


def get_check_service(
    settings: Settings = Depends(get_settings),
    dify_client: DifyClient = Depends(get_dify_client),
) -> CheckService:
    return CheckService(settings=settings, dify_client=dify_client)


@router.post("/translate/kb", response_model=ApiResponse[TranslationResult])
async def translate_with_kb(
    payload: TranslationRequest,
    service: TranslationService = Depends(get_translation_service),
) -> ApiResponse[TranslationResult]:
    return ApiResponse(success=True, data=await service.translate_with_kb(payload), error=None)


@router.post("/translate/direct", response_model=ApiResponse[TranslationResult])
async def translate_direct(
    payload: TranslationRequest,
    service: TranslationService = Depends(get_translation_service),
) -> ApiResponse[TranslationResult]:
    return ApiResponse(success=True, data=await service.translate_direct(payload), error=None)


@router.post("/translate/compare", response_model=ApiResponse[CompareTranslationResult])
async def compare_translate(
    payload: TranslationRequest,
    service: TranslationService = Depends(get_translation_service),
) -> ApiResponse[CompareTranslationResult]:
    return ApiResponse(success=True, data=await service.compare_translate(payload), error=None)


@router.post("/check", response_model=ApiResponse[CheckResult])
async def check_translation(
    payload: CheckRequest,
    service: CheckService = Depends(get_check_service),
) -> ApiResponse[CheckResult]:
    return ApiResponse(success=True, data=await service.check_translation(payload), error=None)
