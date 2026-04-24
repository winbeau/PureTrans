from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field


DataT = TypeVar("DataT")


class ErrorInfo(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    code: str
    message: str
    request_id: str = Field(alias="requestId")


class ApiResponse(BaseModel, Generic[DataT]):
    success: bool
    data: DataT | None
    error: ErrorInfo | None
