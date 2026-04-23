# AGENTS.md

## Project Role

You are working on **PureTrans / 清译**, an Android-first AI translation app.

PureTrans solves three core problems:

1. Reduce AI translation context hallucination through explicit context capture, retrieval, and verification.
2. Support real-time and near-real-time voice translation on Android.
3. Integrate a Xinjiang-localized RAG knowledge base for region-specific terminology, culture, policies, locations, names, and domain knowledge.

All implementation decisions should optimize for correctness, low-friction mobile usage, and maintainable modular architecture.

## Product Principles

- Translation must be context-aware, not just sentence-level.
- The app must make uncertainty visible instead of hiding it.
- Xinjiang-localized RAG results must be traceable and distinguishable from model-generated content.
- Voice translation should prioritize latency, clarity, and interruption handling.
- UI should be extremely minimal, dense, and readable, inspired by Notion and GitHub Discussions.
- Mobile gestures are first-class interactions, not afterthoughts.

## Technology Stack

Frontend:

- Vue 3
- TypeScript
- Tailwind CSS
- Capacitor for Android packaging

Backend:

- FastAPI
- `uv` for Python dependency and environment management
- Dify for LLM workflow orchestration
- RAG knowledge base integration through backend-owned service boundaries

Android / Debugging:

- Capacitor Android runtime
- Wireless ADB target: `192.168.3.49:43051`
- Prefer live device verification and log inspection for mobile behavior

## Architecture Boundaries

The frontend must only handle:

- UI state
- Mobile gestures
- Audio recording / playback control
- Calling typed backend APIs
- Displaying translation, context, citations, and uncertainty

The backend must own:

- Dify workflow calls
- RAG retrieval
- prompt/context assembly
- translation verification
- speech-to-text / text-to-speech orchestration if server-side
- persistence and audit-friendly logs

Dify must own:

- LLM workflow composition
- prompt chains
- model routing
- reusable translation/refinement workflows

The app must not place Dify secrets, model API keys, or RAG credentials in frontend code.

## Recommended Repository Shape

Use this structure unless an existing repo structure already defines another convention:

```text
.
├── AGENTS.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── features/
│   │   │   ├── translation/
│   │   │   ├── voice/
│   │   │   └── rag/
│   │   ├── lib/
│   │   ├── types/
│   │   └── styles/
│   ├── capacitor.config.ts
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── services/
│   │   │   ├── dify/
│   │   │   ├── rag/
│   │   │   ├── translation/
│   │   │   └── voice/
│   │   ├── schemas/
│   │   └── main.py
│   ├── pyproject.toml
│   └── uv.lock
└── docs/
```

## TypeScript Standards

- Prefer explicit TypeScript types for API payloads, translation states, RAG citations, audio states, and error states.
- Do not use `any` unless there is a documented boundary with unknown external data.
- Put shared frontend domain types under `frontend/src/types/` or feature-local `types.ts`.
- Use discriminated unions for async and translation states.

Recommended state shape:

```ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading'; startedAt: number }
  | { status: 'success'; data: T }
  | { status: 'error'; error: AppError };
```

## Frontend UI Standards

- UI must be mobile-first.
- Use compact layouts with high information density.
- Avoid decorative UI that reduces readability.
- Prefer clear hierarchy, subtle borders, restrained color, and strong spacing discipline.
- Translation results should show:
  - source text
  - translated text
  - detected or selected context
  - RAG citations when used
  - uncertainty or ambiguity indicators
  - alternate translation suggestions when useful
- Voice UI should support:
  - press-to-talk
  - clear recording state
  - cancellation gesture
  - playback/retry affordances
  - visible latency/progress feedback

Tailwind usage:

- Prefer semantic component composition over long unreadable class chains.
- Extract repeated patterns into Vue components.
- Keep responsive behavior explicit.

## Vue Standards

- Use Vue 3 Composition API.
- Keep components focused and small.
- Move business logic into composables or feature services.
- Do not call backend APIs directly from deeply nested visual components.
- Keep feature modules independently understandable.

Recommended feature layout:

```text
features/translation/
├── api.ts
├── types.ts
├── composables/
├── components/
└── utils.ts
```

## Backend Standards

- Use FastAPI routers grouped by feature.
- Use Pydantic models for all request and response payloads.
- Keep service integrations behind interfaces/classes.
- Do not let route handlers contain workflow orchestration logic.
- Keep Dify client code isolated from translation business logic.
- Keep RAG retrieval isolated from prompt assembly.
- Log enough metadata to debug translation quality without leaking sensitive user content unnecessarily.

Recommended backend separation:

```text
api route -> schema validation -> service orchestration -> Dify/RAG clients
```

## Dify Integration Rules

- Dify workflow IDs, API keys, base URLs, and dataset IDs must come from environment variables or backend config.
- Frontend must never call Dify directly.
- Backend responses should normalize Dify output into stable app-owned schemas.
- Store raw Dify responses only in debug-safe logs or development traces.
- Treat Dify workflow changes as API-affecting changes and document expected input/output shape.

## RAG Rules

RAG output must preserve provenance.

Every retrieved item used in a translation should include:

- source ID
- title or label
- snippet
- relevance score if available
- knowledge domain
- retrieval timestamp or version if available

The UI must distinguish:

- user-provided context
- retrieved local knowledge
- model inference

Do not silently mix RAG facts into translation output without making the source visible when the fact affects meaning.

## Voice Translation Rules

- Treat recording permission, microphone availability, network latency, and cancellation as normal states.
- Avoid assuming uninterrupted audio sessions.
- Design APIs so partial and final transcript states can be represented.
- Keep voice state typed and explicit.
- Prefer streaming-capable abstractions even if the first implementation is request/response.

Minimum voice states:

```ts
type VoiceSessionState =
  | 'idle'
  | 'requesting-permission'
  | 'recording'
  | 'transcribing'
  | 'translating'
  | 'playing'
  | 'error';
```

## API Design Rules

- Backend API responses must be stable and app-owned.
- Do not leak provider-specific response shapes to the frontend.
- Use clear error codes for frontend handling.
- Include request IDs for debugging translation failures.

Recommended API groups:

```text
/api/translation
/api/voice
/api/rag
/api/health
```

## Error Handling

Errors should be user-actionable when possible.

Frontend error messages should distinguish:

- network unavailable
- microphone permission denied
- Dify workflow failure
- RAG unavailable
- translation ambiguity
- unsupported language/audio format

Backend errors should include:

- stable error code
- human-readable message
- request ID
- safe debug detail in development only

## Android / ADB Debugging

Wireless ADB target:

```bash
adb connect 192.168.3.49:43051
```

Useful commands:

```bash
adb devices
adb logcat
adb logcat | grep -i capacitor
```

When debugging Android behavior:

- verify on the real connected device when UI, audio, permissions, or Capacitor plugins are involved
- inspect logs before guessing
- document device-only issues separately from browser-only issues

## Development Commands

Use project-local commands once the corresponding packages exist.

Frontend examples:

```bash
pnpm install
pnpm dev
pnpm build
pnpm cap sync android
pnpm cap run android
```

Android build note:

- If `./gradlew assembleDebug` tries to download Gradle and times out, prefer the system `gradle assembleDebug` when `gradle --version` reports Gradle 8.7, because it matches the current wrapper requirement.

Backend examples:

```bash
uv sync
uv run fastapi dev app/main.py
uv run pytest
```

Do not add dependencies without a clear reason. Prefer small, well-maintained libraries.

## Testing Expectations

Frontend:

- typecheck before completion
- test composables and feature logic where practical
- manually verify mobile layout and gesture behavior
- verify Android-specific behavior on device when Capacitor APIs are involved

Backend:

- test FastAPI routes
- test Dify client normalization with mocked responses
- test RAG retrieval formatting and citation preservation
- test failure cases, not only happy paths

Minimum acceptance before marking a feature complete:

- TypeScript passes
- backend tests pass for touched services
- API contracts are typed
- mobile layout is usable at common Android viewport sizes
- no secrets are exposed to frontend code

## Security And Privacy

- Never commit API keys, Dify tokens, model provider keys, or private dataset credentials.
- Keep `.env` files out of version control unless they are safe examples.
- Avoid logging full user audio transcripts in production.
- Avoid storing sensitive translation content unless explicitly required.
- Treat regional knowledge base content as auditable data with source tracking.

## Code Quality Rules

- Keep modules small and feature-oriented.
- Prefer explicit names over clever abstractions.
- Avoid global mutable state.
- Avoid circular dependencies.
- Do not mix UI, API, and domain logic in one file.
- Keep public interfaces stable and typed.
- Add comments only when they explain non-obvious reasoning.

## Commit Message Convention

- Use Conventional Commits: `<type>(<scope>): <summary>`.
- Keep one logical change per commit. Do not mix UI cleanup, backend contract changes, and dependency churn in the same commit unless they are tightly coupled.
- Prefer concise Chinese summaries for product-facing work in this repo; keep the scope in English and stable.
- Good types: `feat`, `fix`, `refactor`, `docs`, `test`, `build`, `chore`.
- Recommended scopes: `frontend`, `backend`, `android`, `rag`, `voice`, `docs`.
- The summary should describe the user-visible or engineering outcome, not the editing action. Avoid vague subjects like `update`, `misc`, or `changes`.
- Add a body when the reason, risk, or verification matters, especially for Android behavior, API contracts, or Dify/RAG integration changes.

Examples:

```text
feat(frontend): 收敛首页 recent 卡片与底部操作区
fix(android): 修复 Capacitor 首页在真机上的安全区偏移
docs(project): 补充 commit message 规范
```

## Agent Workflow

Before making changes:

1. Inspect the existing structure.
2. Identify the correct frontend/backend boundary.
3. Check existing types, schemas, and conventions.
4. Make the smallest coherent change.
5. Verify with relevant tests or commands.
6. Report what changed, what was verified, and what remains risky.

When uncertain:

- prefer reading code over guessing
- ask only when the decision is product or architecture intent
- do not invent backend contracts without updating typed schemas
- do not bypass the backend to call model providers from the frontend

## Definition Of Done

A change is done only when:

- the feature works in the intended runtime
- types and schemas are updated
- errors are handled
- mobile behavior is considered
- Dify/RAG/provider details are isolated behind backend services
- tests or manual verification are documented
- no secrets or environment-specific values are committed
