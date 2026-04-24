from __future__ import annotations

from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator


DEFAULT_USER_ID = "android-user"
TranslationDirection = Literal["中英", "英中", "俄中", "中俄", "维中", "中维", "维俄", "俄维"]


class TranslationRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    direction: TranslationDirection
    source_text: str = Field(min_length=1, max_length=10000)
    user_id: str = Field(default=DEFAULT_USER_ID, min_length=1, max_length=128)

    @field_validator("user_id", mode="before")
    @classmethod
    def default_user_id(cls, value: object) -> object:
        if value is None or (isinstance(value, str) and not value.strip()):
            return DEFAULT_USER_ID
        return value


class RagCitation(BaseModel):
    source_id: str
    title: str | None = None
    snippet: str
    relevance_score: float | None = None
    knowledge_domain: str | None = None
    retrieved_at: str | None = None


class TranslationResult(BaseModel):
    direction: TranslationDirection
    source_text: str
    translated_text: str
    mode: Literal["kb", "direct"]
    citations: list[RagCitation] = Field(default_factory=list)


class CompareTranslationResult(BaseModel):
    direction: TranslationDirection
    source_text: str
    kb_translation: TranslationResult
    direct_translation: TranslationResult


class CheckRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    direction: TranslationDirection
    source_text: str = Field(min_length=1, max_length=10000)
    target_text: str = Field(min_length=1, max_length=10000)
    user_id: str = Field(default=DEFAULT_USER_ID, min_length=1, max_length=128)

    @field_validator("user_id", mode="before")
    @classmethod
    def default_user_id(cls, value: object) -> object:
        if value is None or (isinstance(value, str) and not value.strip()):
            return DEFAULT_USER_ID
        return value


class CheckIssue(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    type: str = Field(min_length=1)
    severity: str | None = None
    message: str = Field(min_length=1)
    suggestion: str | None = None


class CheckResult(BaseModel):
    direction: TranslationDirection
    source_text: str
    target_text: str
    issues: list[CheckIssue]
    revised_text: str = Field(validation_alias=AliasChoices("revised_text", "revisedText"))
