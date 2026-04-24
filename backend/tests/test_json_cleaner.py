from __future__ import annotations

from app.services.dify_utils import strip_markdown_json_block


def test_json_cleaner_preserves_plain_json() -> None:
    assert strip_markdown_json_block('{"ok": true}') == '{"ok": true}'


def test_json_cleaner_strips_lowercase_json_fence() -> None:
    assert strip_markdown_json_block('```json\n{"ok": true}\n```') == '{"ok": true}'


def test_json_cleaner_strips_uppercase_json_fence() -> None:
    assert strip_markdown_json_block('```JSON\n{"ok": true}\n```') == '{"ok": true}'


def test_json_cleaner_strips_plain_fence() -> None:
    assert strip_markdown_json_block('```\n{"ok": true}\n```') == '{"ok": true}'


def test_json_cleaner_trims_whitespace() -> None:
    assert strip_markdown_json_block('\n  {"ok": true}  \n') == '{"ok": true}'
