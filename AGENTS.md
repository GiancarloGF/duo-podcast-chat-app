# Relatos en Inglés – Agent Playbook

## Purpose & Context
- This repo hosts a Next.js 16 (App Router) + React 19 app that turns podcast transcripts into translation drills.
- The UX: fetch podcast episodes (Mongo `master_data`), track user progress (Mongo `chat-app`), and score user translations through Gemini structured responses.
- `pnpm` is the blessed package manager; never mix with npm/yarn.
- Agents must default to Spanish copy in UI strings unless inheriting existing English placeholders.
- There are no Cursor or Copilot instruction files in this repo; this playbook is the only meta-guidance.

## Commands & Tooling Expectations
- `pnpm install` – install deps (lockfile is pnpm-lock.yaml).
- `pnpm dev` – Next dev server with React Refresh; use when verifying UI manually.
- `pnpm build` – Next production build; run before shipping server-only changes.
- `pnpm start` – serve the `.next` build locally; mirror production runtime.
- `pnpm lint` – repo-wide ESLint (Next default rules + type-aware); add `--fix` when safe.
- Tests are not wired yet (no `pnpm test`); document and/or introduce a test runner before claiming automated coverage.
- Until a runner exists, rely on targeted utility scripts or add ad-hoc `vitest` tests (`pnpm vitest path/to/file.test.ts`) once the dependency lands.
- Use `node --env-file=.env.local scripts/<name>.mjs` for maintenance scripts (seeding/cleanup) to ensure env variables load.

## Directory Tour & Responsibilities
- **Clean Architecture** – The codebase follows a feature-based structure under `src/` with `features/`, `shared/`, and `app/`.
- `src/app/` – Next.js App Router (pages, layout, globals.css, API routes). All routes default to server components unless `'use client'` is declared.
- `src/app/page.tsx` – landing page; uses `@/features/home` (GetHomeFeatures, FeatureList).
- `src/app/stories/page.tsx` – listado principal de episodios (`dynamic = 'force-dynamic'`); usa `@/features/stories`.
- `src/app/stories/chat/[userProgressId]/page.tsx` – página del chat; obtiene progreso y episodio, hidrata `ChatContainer` desde `@/features/stories/presentation/components`.
- `src/app/chat/[userProgressId]/page.tsx` – redirige a `/stories/chat/[userProgressId]` por compatibilidad.
- `src/app/api/*` – episodes, get-feedback, validate-translation; usan DB compartida y servicios del feature stories.
- `src/features/` – Cada feature tiene `domain/`, `application/`, `infrastructure/`, `presentation/`. Features: `home`, `stories` (episodios + chat/traducciones), `auth`, `phrasal-verbs` (placeholder).
- `src/shared/` – `domain/` (errors, types), `infrastructure/` (database/mongo, config), `presentation/` (components/ui, hooks, layouts, utils).
- El feature **stories** concentra: listado de episodios, chat de traducción, progreso de usuario, feedback Gemini, tipos UI (ChatMessage, etc.), `clientStorage`, `StatsService`, `episode-loader` para JSON estático y `ClientFeedbackService` para llamadas cliente a get-feedback.
- `components/` – Legacy UI (chat, home, ui, stats); app routes import from `@/features/*` and `@/shared/*`. Prefer adding new UI under the corresponding feature’s `presentation/` or `shared/presentation/`.
- `scripts/` – One-off maintenance tasks that speak directly to Mongo.

## Data & Execution Flow
- Mongo connection lives in `src/shared/infrastructure/database/mongo/connection.ts`, caches via `globalThis`; call `await dbConnect()` before touching models. Models are in `src/shared/infrastructure/database/mongo/models/` (Episode → `master_data`; UserProgress, SavedWord, User → `chat-app`).
- Episodes: `src/features/stories` (domain entities, EpisodeRepository, MongoEpisodeRepository, GetStories/GetEpisodeById use cases). Stories page and chat use `getAllEpisodesAction`, `getEpisodeByIdAction` from `@/features/stories/presentation/actions`.
- User progress and translations: dentro de `src/features/stories` (UserProgress, Interaction, TranslationFeedback; UserProgressRepository, MongoUserProgressRepository; GeminiTranslationService, TranslationValidationService; use cases y actions en `presentation/actions.ts`).
- Auth: `src/features/auth` (stub User, GetCurrentUser, StubAuthRepository). Usar `getCurrentUserId()` desde `@/features/auth/presentation/actions` en lugar de `CONSTANTS.FAKE_USER_ID`.
- Flujo de traducción: texto cliente → `TranslationValidationService` (opcional) → `submitTranslation` / `updateProgress` (stories) → Gemini vía `GeminiTranslationService` → Mongo vía repositorios → UI.
- Almacenamiento local: `src/features/stories/infrastructure/storage/client-storage.ts`. Estadísticas: `src/features/stories/application/services/StatsService.ts`; confirmar uso antes de extender.

## API & Server Actions Practices
- API routes live under `src/app/api/*/route.ts` and must return `Response.json(...)` or `NextResponse`; include defensive validation plus minimal logging.
- `src/app/api/get-feedback` uses `GeminiTranslationService.getFeedback`; surface `details` on 500s for debugging.
- `src/app/api/validate-translation` uses `TranslationValidationService.validate`; keep it dependency-light (no DB).
- `src/app/api/episodes` and `[id]` use shared DB connection and models; never assume cached Mongoose state.
- Server Actions viven en `presentation/actions.ts` del feature (e.g. `@/features/stories/presentation/actions`). Las que redirigen (e.g. `startChatByEpisode` a `/stories/chat/${progressId}`) deben llamar `revalidatePath('/')`.
- `submitTranslation` wraps Gemini errors and returns `{ success: false, message }` so the client can show `ErrorAlert` banners.
- When mutating Mongo from repositories/actions, convert string IDs to `Types.ObjectId` where needed and output `_id` as strings to the client.

## Frontend Implementation Notes
- Client components require `'use client'` at the top; server components must stay hook-free.
- `ChatContainer` está en `src/features/stories/presentation/components/`; concentra la lógica de estado, actualizaciones optimistas, `useMemo` para mensajes entrelazados y la UI de episodio completado.
- `MessageBubble` tokeniza los discursos del protagonista para el modal de definición de palabras. Mantener helpers memoizados puros; evitar APIs del navegador ahí.
- `WordDefinitionModal` usa server actions de `@/features/stories/presentation/actions` (`getWordDefinition`, `saveWord`) y toasts con `sonner`; mantener solo en cliente.
- Markdown rendering uses `react-markdown` + `remark-gfm`; wrap paragraphs with custom renderers when trimming margins.
- Navigation uses `<Link>` plus `useRouter()` for imperative transitions (e.g., completion CTA). Keep those interactions on the client side.
- Keep Spanish localization consistent (`Atrás`, `Continuar`, etc.); do not regress to English when extending UI strings.

## Styling & Theming
- Tailwind CSS v4 is imported globally through `app/globals.css` with `@theme inline`. Avoid editing generated `tailwind.config`; rely on CSS variables declared in `:root`/`.dark` scopes.
- Usar la utilidad `cn` (`@/shared/presentation/utils`) para combinar clases; ya envuelve `clsx` + `tailwind-merge`.
- Components lean on shadcn’s `cva` variants; extend via `className` overrides rather than forking primitives.
- Typography is anchored by `Varela_Round` (see `src/app/layout.tsx`). Apply `font-sans` to new layout wrappers if needed.
- Provide gradients or textured backgrounds (see `src/app/page.tsx`, Stories page); avoid flat #fff canvases in new surfaces.
- Respect safe-area helpers (`pb-safe`, etc.) for mobile footers.

## TypeScript & Code Style Guidelines
- TS config enforces `strict`, `moduleResolution: bundler`, and path aliases `@/*`, `@/features/*`, `@/shared/*`. Prefer these over long relative paths.
- Follow file-local conventions: shadcn files omit semicolons, while most server code includes them. Match the surrounding style.
- Los tipos de dominio viven en `domain/entities/` de cada feature (en stories: Episode, UserProgress, TranslationFeedback, Interaction, etc.). Tipos UI como `ChatMessage`, `EpisodeProgress`, `UserStats` están en `src/features/stories/domain/types.ts`.
- Validar datos en runtime con `zod` donde aplique (e.g. `src/features/stories/infrastructure/services/feedback-schema.ts`); preferir parsing guiado por esquema.
- Always annotate return types on exported functions and server actions to clarify serialized shape.
- For async DB access, `await dbConnect()` first (from `@/shared/infrastructure/database/mongo/connection`), then use model getters from `@/shared/infrastructure/database/mongo/models/*`; never import `mongoose.model` statically.
- When logging errors, use contextual prefixes (existing pattern: `console.error('Error fetching episode:', error)`), then throw/return meaningful errors.
- Avoid broad `any` where you can map to known interfaces; when dealing with Mongo `lean()` results, destruct `_id` + convert to string early.

## Error Handling & Validation
- La validación en cliente usa `TranslationValidationService` desde `@/features/stories/infrastructure/services`; reutilizarla antes de llamar a la red.
- Las rutas API deben validar campos requeridos (ver early return en `get-feedback`). Responder con `status: 400/422` para errores de usuario y `500` para fallos de infra.
- `GeminiTranslationService` (feature stories) registra y lanza cuando la respuesta está vacía; los llamadores capturan y convierten a mensajes amigables.
- LocalStorage helpers should stay wrapped in `try/catch` to avoid SSR/Next hydration crashes; continue this pattern for any new browser storage utilities.

## Environment & Secrets
- `.env.local` needs at minimum `GEMINI_API_KEY` and `MONGODB_URI` (defaults to `mongodb://localhost:27017/podcast-chat`). Scripts and dev server both read from this file.
- Gemini requests will fail fast if the API key is missing; ensure CI/CD or Vercel projects define it.
- Mongo URI should point to a cluster hosting two databases (`master_data`, `chat-app`). The connection helper selects DBs dynamically via `useDb()` per model accessor.
- No other secrets are currently referenced; add new env vars to this list and document type/usage inline when introduced.
- Config and constants live in `src/shared/infrastructure/config/` (e.g. `CONSTANTS.FAKE_USER_ID`). `STORIES_DATA_SOURCE` / `CATALOG_DATA_SOURCE` can be used when switching to other adapters (Firebase, etc.).

## Scripts & Operational Tasks
- `scripts/seed-episodes.mjs` – sync `public/episodes/*.json` into Mongo; run with `node --env-file=.env.local scripts/seed-episodes.mjs`.
- `scripts/cleanup-episodes.mjs` – remove documents missing valid `id` fields from `master_data`.
- `scripts/update-episode-titles.mjs` – audit/print episodes with empty titles for manual fixes.
- These scripts connect directly via `mongoose`; close connections explicitly to avoid open handles.

## Testing Status & Recommendations
- There is currently no automated test suite. Document manual verification steps in PRs (e.g., "run `pnpm dev`, translate a message, confirm feedback modal").
- If you introduce Vitest or Playwright, expose scripts in `package.json` and update this file with the exact commands (including how to run a single spec like `pnpm vitest tests/foo.test.ts`).
- For now, you can craft throwaway scripts under `scripts/` (e.g., `scripts/smoke-chat.mts`) but ensure they are never committed without lint coverage.

## Collaboration Notes
- Current user is provided by `getCurrentUserId()` from `@/features/auth/presentation/actions` (stub; replace with real auth when needed).
- Add new server actions in the relevant feature’s `presentation/actions.ts`; prefix with `'use server'` and keep dependencies serializable (no DOM APIs).
- Use `revalidatePath` whenever an action mutates data that surfaces in server components.
- Prefer streaming data fetches over caching; the project uses `force-dynamic` where fresh progress is needed.
- Respect accessibility choices (aria labels in `MessageBubble`, button focus rings). Extend rather than remove.

## When In Doubt
- Read adjacent files before editing to mirror tone, localization, and formatting.
- Favor incremental, well-scoped changes; the Mongo + Gemini stack is easy to break if you skip validation/logging.
- Explain validation and manual QA steps in PR descriptions so future agents can reproduce them quickly.
- Si necesitas nueva infra (queues, cron, etc.), añádela bajo `src/features/stories` o `src/shared` con módulos aislados y amplía este documento.

## UI Microcopy & Localization
- Spanish is the default language for labels, buttons, and helper text; keep tone motivational yet concise.
- Only use English copy when quoting learner output, referencing official translations, or matching legacy placeholders.
- When adding instructions/tooltips, emphasize actionable feedback ("Traduce al inglés" vs. "Ingresar texto").
- Date/time formatting can stay locale-neutral for now, but prefer ISO strings converted via `new Date(...).toLocaleDateString('es-ES')` if shown to users.
- Avoid literal gendered language in new text; lean on inclusive phrasing ("estudiante", "persona").

## State & Side-Effects
- Optimistic UI (e.g., message progression) should always have a rollback or explicit error path; see `ChatContainer` for baseline.
- `useMemo`/`useCallback` guards are already heavy; extend dependencies carefully to prevent stale renders.
- Debounce expensive Gemini calls client-side when you introduce new prompts; `TranslationValidationService` already filters obvious errors.
- Keep `useEffect` cleanup handlers in modals/tooltips to avoid orphaned listeners (see `TranslationInput` focus handler pattern).
- Prefer single-source-of-truth state in parent containers; subcomponents should receive derived props when possible.

## Mongo Modeling Notes
- All IDs from client → server should pass through `new Types.ObjectId(...)` before queries; never trust string equality on `_id` fields.
- `UserProgress` embeds `interactions` without `_id`; keep schema objects lean to avoid hitting document limits when adding analytics fields.
- `Episode` docs keep both `_id` and custom `id`; map whichever is present into `Episode.id` to satisfy UI expectations.
- When extending schemas, keep lean projections in `src/features/stories/infrastructure/repositories/MongoEpisodeRepository.ts` so `/stories` stays lightweight.
- Migrations currently run via ad-hoc scripts; document any breaking schema shifts inside `scripts/` README comments.

## Logging & Observability
- Log actionable context (episodeId, userProgressId) before throwing; avoid leaking raw Gemini payloads in prod builds.
- Keep console noise minimal in shared components—prefer dev-only logs guarded by `if (process.env.NODE_ENV !== 'production')`.
- API routes should log once per failure; downstream server actions can rethrow plain `Error` objects to avoid double-reporting.
- Use `console.warn` for recoverable states (e.g., translation skipped) and `console.error` for hard failures only.
- No structured logging library is configured; if you introduce one, ensure it works in both Node and Edge runtimes.

## Delivery & PR Hygiene
- Title commits/PRs with verbs (`Add episode cache busting`, `Fix Gemini feedback parsing`).
- Summaries should mention manual QA steps ("`pnpm dev`, translate `Hola`, verified feedback modal shows score").
- Run `pnpm lint` before requesting review—even for doc-only changes—to catch unused imports or type drift.
- Keep PRs scoped: UI polish separate from backend rewrites to ease regression tracking.
- If you add dependencies, note why they’re needed and whether they affect client/server bundles.
