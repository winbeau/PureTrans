from __future__ import annotations


def strip_markdown_json_block(text: str) -> str:
    cleaned = text.strip()
    if not cleaned.startswith("```") or not cleaned.endswith("```"):
        return cleaned

    lines = cleaned.splitlines()
    if len(lines) < 2:
        return cleaned

    opening = lines[0].strip()
    if opening not in ("```", "```json", "```JSON"):
        return cleaned

    closing = lines[-1].strip()
    if closing != "```":
        return cleaned

    return "\n".join(lines[1:-1]).strip()
