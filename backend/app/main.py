from __future__ import annotations

from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.core.config import get_settings
from app.core.errors import AppError
from app.schemas.auth import ErrorDetail, ErrorResponse


def create_app() -> FastAPI:
    settings = get_settings()
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
        response = ErrorResponse(
            requestId=uuid4().hex,
            error=ErrorDetail(code=exc.code, message=exc.message),
        )
        return JSONResponse(status_code=exc.status_code, content=response.model_dump(by_alias=True))

    app.include_router(auth_router)
    app.include_router(health_router)
    return app


app = create_app()
