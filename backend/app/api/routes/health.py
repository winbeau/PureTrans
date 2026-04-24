from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.schemas.auth import HealthResponse


router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def get_health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(
        requestId=uuid4().hex,
        status="ok",
        wechatConfigured=settings.wechat_configured,
    )
