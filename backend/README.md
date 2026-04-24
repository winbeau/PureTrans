# PureTrans Backend

FastAPI backend for PureTrans Android clients. It owns WeChat auth, Dify workflow calls, and the app-owned translation API contract.

## Environment

Copy `.env.example` to `.env` for local development. Dify keys must stay server-side and must not be exposed to the frontend or Android bundle.

Required Dify variables:

- `DIFY_BASE_URL`
- `DIFY_KB_TRANSLATE_API_KEY`
- `DIFY_DIRECT_TRANSLATE_API_KEY`
- `DIFY_CHECK_API_KEY`
- `DIFY_TIMEOUT_SECONDS`

## API

- `GET /health`
- `GET /api/health`
- `POST /api/v1/translate/kb`
- `POST /api/v1/translate/direct`
- `POST /api/v1/translate/compare`
- `POST /api/v1/check`

The `/api/v1` routes return:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Errors use the same envelope with `success: false`.

## Development

```bash
uv sync --dev
uv run fastapi dev app/main.py
uv run pytest
```

## Docker

```bash
docker compose up --build
```
