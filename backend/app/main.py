from __future__ import annotations

import logging
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.translation import router as translation_router
from app.core.config import get_settings
from app.core.errors import AppError, UnifiedApiError
from app.schemas.api import ApiResponse, ErrorInfo
from app.schemas.auth import ErrorDetail, ErrorResponse


def create_app() -> FastAPI:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level.upper())
    app = FastAPI(title="PureTrans Backend")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins) or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppError)
    async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        if isinstance(exc, UnifiedApiError):
            request_id = uuid4().hex
            response = ApiResponse(
                success=False,
                data=None,
                error=ErrorInfo(code=exc.code, message=exc.message, request_id=request_id),
            )
            return JSONResponse(status_code=exc.status_code, content=response.model_dump(by_alias=True))

        response = ErrorResponse(
            requestId=uuid4().hex,
            error=ErrorDetail(code=exc.code, message=exc.message),
        )
        return JSONResponse(status_code=exc.status_code, content=response.model_dump(by_alias=True))

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, __: RequestValidationError) -> JSONResponse:
        request_id = uuid4().hex
        response = ApiResponse(
            success=False,
            data=None,
            error=ErrorInfo(
                code="VALIDATION_ERROR",
                message="Request validation failed.",
                request_id=request_id,
            ),
        )
        return JSONResponse(status_code=422, content=response.model_dump(by_alias=True))

    @app.exception_handler(Exception)
    async def handle_unexpected_error(_: Request, __: Exception) -> JSONResponse:
        request_id = uuid4().hex
        response = ApiResponse(
            success=False,
            data=None,
            error=ErrorInfo(
                code="INTERNAL_ERROR",
                message="Internal server error.",
                request_id=request_id,
            ),
        )
        return JSONResponse(status_code=500, content=response.model_dump(by_alias=True))

    @app.get("/health")
    async def get_root_health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(auth_router)
    app.include_router(health_router)
    app.include_router(translation_router)
    return app


app = create_app()
