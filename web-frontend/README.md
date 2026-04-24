# PureTrans React Web Demo

Independent React + Vite demo frontend for the existing PureTrans FastAPI backend.

## Setup

```bash
pnpm install
pnpm dev -- --host 0.0.0.0
```

By default the app calls `http://124.71.228.242:8000`. To override it:

```bash
cp .env.example .env
```

Then edit `VITE_API_BASE_URL`.

## Scripts

```bash
pnpm dev
pnpm build
pnpm preview
```

## Backend Endpoints

The UI calls only the app-owned FastAPI API:

- `GET /api/health`
- `POST /api/v1/translate/kb`
- `POST /api/v1/translate/direct`
- `POST /api/v1/translate/compare`
- `POST /api/v1/check`

No Dify keys or provider credentials belong in this frontend.
