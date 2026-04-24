from __future__ import annotations

import pytest

from app.core.config import get_settings


@pytest.fixture(autouse=True)
def clear_settings_cache() -> None:
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def dify_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DIFY_BASE_URL", "https://dify.test/v1")
    monkeypatch.setenv("DIFY_KB_TRANSLATE_API_KEY", "kb-key")
    monkeypatch.setenv("DIFY_DIRECT_TRANSLATE_API_KEY", "direct-key")
    monkeypatch.setenv("DIFY_CHECK_API_KEY", "check-key")
    monkeypatch.setenv("DIFY_TIMEOUT_SECONDS", "3")
