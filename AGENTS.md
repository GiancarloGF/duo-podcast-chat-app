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
- `src/app/stories/page.tsx` – dashboard listing episodes (`dynamic = 'force-dynamic'`); uses `@/features/stories` and `@/features/translations`.
- `src/app/chat/[userProgressId]/page.tsx` – fetches progress + episode, hydrates `ChatContainer` from `@/features/translations/presentation/components`.
- `src/app/api/*` – episodes, get-feedback, validate-translation; use shared DB and feature services.
- `src/features/` – Each feature has `domain/` (entities, repository interfaces), `application/` (use cases, DTOs), `infrastructure/` (repositories, mappers, services), `presentation/` (components, hooks, stores, server actions). Features: `home`, `stories`, `translations`, `auth`, `phrasal-verbs` (placeholder).
- `src/shared/` – `domain/` (errors, types), `infrastructure/` (database/mongo connection + models, config/constants), `presentation/` (components/ui, hooks, layouts, utils).
- `lib/` – Remaining: `types.ts` (shared types used by UI), `storage.ts`, `stats.ts`, `store/`, `ai-service.ts`, `episode-loader.ts`. DB and actions have moved to `src/shared` and `src/features`.
- `components/` – Legacy UI (chat, home, ui, stats); app routes import from `@/features/*` and `@/shared/*`. Prefer adding new UI under the corresponding feature’s `presentation/` or `shared/presentation/`.
- `scripts/` – One-off maintenance tasks that speak directly to Mongo.

## Data & Execution Flow
- Mongo connection lives in `src/shared/infrastructure/database/mongo/connection.ts`, caches via `globalThis`; call `await dbConnect()` before touching models. Models are in `src/shared/infrastructure/database/mongo/models/` (Episode → `master_data`; UserProgress, SavedWord, User → `chat-app`).
- Episodes: `src/features/stories` (domain entities, EpisodeRepository, MongoEpisodeRepository, GetStories/GetEpisodeById use cases). Stories page and chat use `getAllEpisodesAction`, `getEpisodeByIdAction` from `@/features/stories/presentation/actions`.
- User progress and translations: `src/features/translations` (UserProgress, Interaction, TranslationFeedback; UserProgressRepository, MongoUserProgressRepository; GeminiTranslationService, TranslationValidationService; use cases and presentation actions). Server actions with `'use server'` live in each feature’s `presentation/actions.ts` and call use cases.
- Auth: `src/features/auth` (stub User, GetCurrentUser, StubAuthRepository). Use `getCurrentUserId()` from `@/features/auth/presentation/actions` instead of `CONSTANTS.FAKE_USER_ID` in new code.
- Translation flow: client text → `TranslationValidationService` (optional) → `submitTranslation` / `updateProgress` (translations feature) → Gemini via `GeminiTranslationService` → Mongo via repositories → UI re-renders.
- Local storage (`lib/storage.ts`) and statistics (`lib/stats.ts`) exist but aren’t yet wired into UI; confirm usage before extending.

## API & Server Actions Practices
- API routes live under `src/app/api/*/route.ts` and must return `Response.json(...)` or `NextResponse`; include defensive validation plus minimal logging.
- `src/app/api/get-feedback` uses `GeminiTranslationService.getFeedback`; surface `details` on 500s for debugging.
- `src/app/api/validate-translation` uses `TranslationValidationService.validate`; keep it dependency-light (no DB).
- `src/app/api/episodes` and `[id]` use shared DB connection and models; never assume cached Mongoose state.
- Server Actions live in feature `presentation/actions.ts` (e.g. `@/features/translations/presentation/actions`). Those that redirect (e.g. `startChatByEpisode`) must call `revalidatePath('/')`.
- `submitTranslation` wraps Gemini errors and returns `{ success: false, message }` so the client can show `ErrorAlert` banners.
- When mutating Mongo from repositories/actions, convert string IDs to `Types.ObjectId` where needed and output `_id` as strings to the client.

## Frontend Implementation Notes
- Client components require `'use client'` at the top; server components must stay hook-free.
- `ChatContainer` lives in `src/features/translations/presentation/components/`; it houses stateful logic, optimistic updates, `useMemo` for message interleaving, and fallback UI once an episode is complete.
- `MessageBubble` tokenizes protagonist speeches to enable the word-definition modal. Keep memoized helpers pure; avoid referencing browser APIs there.
- `WordDefinitionModal` triggers server actions from `@/features/translations/presentation/actions` (`getWordDefinition`, `saveWord`) and surfaces toast notifications with `sonner`; keep these client-only.
- Markdown rendering uses `react-markdown` + `remark-gfm`; wrap paragraphs with custom renderers when trimming margins.
- Navigation uses `<Link>` plus `useRouter()` for imperative transitions (e.g., completion CTA). Keep those interactions on the client side.
- Keep Spanish localization consistent (`Atrás`, `Continuar`, etc.); do not regress to English when extending UI strings.

## Styling & Theming
- Tailwind CSS v4 is imported globally through `app/globals.css` with `@theme inline`. Avoid editing generated `tailwind.config`; rely on CSS variables declared in `:root`/`.dark` scopes.
- Use `cn` utility (`lib/utils.ts`) to merge classes; it already wraps `clsx` + `tailwind-merge`.
- Components lean on shadcn’s `cva` variants; extend via `className` overrides rather than forking primitives.
- Typography is anchored by `Varela_Round` (see `src/app/layout.tsx`). Apply `font-sans` to new layout wrappers if needed.
- Provide gradients or textured backgrounds (see `src/app/page.tsx`, Stories page); avoid flat #fff canvases in new surfaces.
- Respect safe-area helpers (`pb-safe`, etc.) for mobile footers.

## TypeScript & Code Style Guidelines
- TS config enforces `strict`, `moduleResolution: bundler`, and path aliases `@/*`, `@/features/*`, `@/shared/*`. Prefer these over long relative paths.
- Follow file-local conventions: shadcn files omit semicolons, while most server code includes them. Match the surrounding style.
- Domain types live in each feature’s `domain/entities/` (e.g. `Episode` in stories, `UserProgress`/`TranslationFeedback` in translations). `lib/types.ts` remains for backward compatibility and shared UI types (e.g. `ChatMessage`).
- Validate runtime data with `zod` where applicable (e.g. `src/features/translations/infrastructure/services/feedback-schema.ts`); prefer schema-driven parsing.
- Always annotate return types on exported functions and server actions to clarify serialized shape.
- For async DB access, `await dbConnect()` first (from `@/shared/infrastructure/database/mongo/connection`), then use model getters from `@/shared/infrastructure/database/mongo/models/*`; never import `mongoose.model` statically.
- When logging errors, use contextual prefixes (existing pattern: `console.error('Error fetching episode:', error)`), then throw/return meaningful errors.
- Avoid broad `any` where you can map to known interfaces; when dealing with Mongo `lean()` results, destruct `_id` + convert to string early.

## Error Handling & Validation
- Client-side validation uses `TranslationValidationService` from `@/features/translations/infrastructure/services`; reuse it before hitting the network to reduce load.
- Server routes must guard required fields (see `get-feedback` early return). Respond with `status: 400/422` for user errors and `500` for infra issues.
- `GeminiTranslationService` (translations feature) logs when responses are empty and throws; callers catch and convert to user-friendly messages.
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
- If you need new infra (queues, cron, etc.), add it under `lib/` with isolated modules and expand this document accordingly.

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
