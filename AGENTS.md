# Relatos en Ingles - Agent Playbook

## Scope and Purpose
- This repository is a Next.js 16 + React 19 app for translation drills based on podcast episodes.
- Data comes from MongoDB (`master_data` + `chat-app`) and translation feedback comes from Gemini.
- Use `pnpm` only. Do not use `npm` or `yarn` in this repo.
- Prefer Spanish UI copy for labels, helper text, and prompts unless existing UI already uses English.

## Source of Truth for Agent Rules
- Primary rule file: `AGENTS.md` (this file).
- Cursor rules check:
  - `.cursorrules`: not present.
  - `.cursor/rules/`: not present.
- Copilot rules check:
  - `.github/copilot-instructions.md`: not present.
- If these files are later added, merge their instructions into this playbook and follow the most specific rule.

## Build, Lint, and Test Commands
- Install dependencies: `pnpm install`
- Start dev server: `pnpm dev`
- Production build: `pnpm build`
- Start production server: `pnpm start`
- Lint entire repo: `pnpm lint`
- Auto-fix lint issues when safe: `pnpm lint --fix`

## Testing Commands (Current State + Single Test Guidance)
- There is currently no test script in `package.json` and no test runner config checked in.
- There are no `*.test.*` / `*.spec.*` files at the moment.
- If you add Vitest, recommended scripts:
  - `"test": "vitest run"`
  - `"test:watch": "vitest"`
- Run all tests (once added): `pnpm test`
- Run a single test file (once added): `pnpm vitest run path/to/file.test.ts`
- Run a single test by name (once added): `pnpm vitest run path/to/file.test.ts -t "test name"`
- If Playwright is introduced, run one spec with `pnpm playwright test tests/e2e/example.spec.ts`.

## High-Level Architecture
- App Router lives in `src/app`.
- Main routes:
  - `src/app/page.tsx`
  - `src/app/(features)/stories/page.tsx`
  - `src/app/(features)/stories/chat/[userProgressId]/page.tsx`
- API routes live in `src/app/api/**/route.ts`.
- Feature modules live in `src/features/*` with `domain`, `application`, `infrastructure`, and `presentation` layers.
- Shared infrastructure and UI primitives live in `src/shared/**`.

## Import and Module Conventions
- Prefer path aliases over deep relative imports:
  - `@/*`, `@/features/*`, `@/shared/*`
- Keep imports grouped in this order:
  1) framework and third-party packages
  2) internal alias imports
  3) same-folder relative imports
- Prefer `import type` for type-only imports.
- Avoid circular imports between layers (`presentation` should not leak infra details unless already established).

## Formatting and Style
- Follow local file style first (do not reformat unrelated lines).
- Codebase currently has mixed conventions:
  - many feature/server files use semicolons
  - many shadcn-style UI files omit semicolons
- Match quote style and semicolon style of the file you are editing.
- Keep JSX className strings readable; avoid unnecessary class churn.
- Use `cn` from `@/shared/presentation/utils` for conditional class composition.

## TypeScript Guidelines
- `tsconfig.json` has `strict: true`; preserve strict typing.
- Always type exported function return values, especially server actions and API handlers.
- Avoid `any`; use domain entities, DTOs, and interfaces.
- Convert Mongo `_id` values to strings before crossing server/client boundaries.
- Use `zod` parsing where schema validation already exists (e.g., Gemini feedback schema).

## Naming Conventions
- React components: PascalCase (`ChatContainer`, `EpisodeCard`).
- Hooks: `useX` (`useUserSession`).
- Use cases: verb-based PascalCase file names (`GetStories.usecase.ts`).
- Server actions: descriptive camelCase (`getAllEpisodesAction`, `startChatByEpisode`).
- Interfaces/types: PascalCase; prefer explicit domain names (`TranslationFeedback`, `UserProgress`).
- Constants: UPPER_SNAKE_CASE for true constants, otherwise descriptive camelCase.

## Next.js and React Rules
- Add `'use client'` only when hooks/browser APIs are required.
- Keep server components free of client hooks.
- Server actions belong in feature `presentation/actions.ts` with `'use server'`.
- For data mutations impacting server-rendered pages, call `revalidatePath` where appropriate.
- Keep optimistic UI updates paired with clear error/rollback behavior.

## Data and Persistence Rules
- Call `await dbConnect()` before any Mongo model access.
- Use model getters from `src/shared/infrastructure/database/mongo/models/*`.
- Do not create static global models with ad-hoc `mongoose.model(...)` patterns.
- Convert string ids to `new mongoose.Types.ObjectId(...)` when querying `_id` fields.
- Keep list queries lean/projection-based for story listing performance.

## API and Error Handling Guidelines
- API handlers should validate required input early and return `400` for client errors.
- Use `500` for unexpected server/infrastructure failures.
- Return consistent JSON shapes (`success`, `error`, optional `details` in debug-safe contexts).
- Log with context (`episodeId`, `userProgressId`, operation name) when available.
- Use `console.warn` for recoverable paths and `console.error` for hard failures.
- Do not leak secrets or full provider payloads in logs.

## Localization and UX Copy
- Default copy language: Spanish.
- Keep terminology consistent (`Atras`, `Siguiente`, `Traducciones`, etc.).
- Use inclusive and action-oriented phrasing.
- Preserve existing visual language: gradients, strong hierarchy, mobile-safe spacing.

## Environment and Secrets
- Required env vars:
  - `MONGODB_URI`
  - `GEMINI_API_KEY`
  - Firebase public vars for auth (`NEXT_PUBLIC_FIREBASE_*`) when auth flows are used.
- Local scripts should be run with env loading:
  - `node --env-file=.env.local scripts/seed-episodes.mjs`
  - `node --env-file=.env.local scripts/cleanup-episodes.mjs`
  - `node --env-file=.env.local scripts/update-episode-titles.mjs`

## Auth and Session Notes
- Authentication is Firebase-based via `src/shared/infrastructure/firebase/*` and `FirebaseAuthRepository`.
- Prefer `getCurrentUserId()` from `@/features/auth/presentation/actions` in server code.
- Avoid direct reads from client auth state in server actions and API handlers.
- Keep serialized user objects minimal (`uid`, `email`, `displayName`, `photoURL`).

## Build and Runtime Caveats
- `next.config.mjs` currently sets `typescript.ignoreBuildErrors: true`.
- This means `pnpm build` may succeed even with TypeScript errors.
- Always run `pnpm lint` and review editor TypeScript diagnostics before merging.
- If you tighten CI later, remove this setting and fix type errors incrementally.

## Operational Scripts
- `scripts/seed-episodes.mjs` syncs `public/episodes/*.json` into Mongo.
- `scripts/cleanup-episodes.mjs` removes invalid episode documents.
- `scripts/update-episode-titles.mjs` reports/fixes missing title fields.
- Keep script logs concise and close Mongo connections explicitly.

## Manual QA Expectations (No Test Runner Yet)
- Verify story listing: open `/stories`, confirm sections and counts render.
- Verify chat flow: start episode, submit translation, confirm feedback appears.
- Verify persistence: reload chat URL and confirm progress remains.
- Verify API errors: malformed request should return `400`, unexpected failures `500`.

## PR and Delivery Checklist
- Run `pnpm lint` before finishing.
- Run `pnpm build` when changing server/runtime-sensitive code.
- If no automated tests exist, document manual QA steps in PR notes.
- Keep PR scope focused; separate refactors from behavior changes when possible.
- If adding a test runner, update this file with exact single-test commands immediately.

## Quick Agent Checklist
- Use `pnpm` only.
- Respect existing file-local formatting conventions.
- Prefer alias imports and `import type`.
- Keep strict typing and explicit return types.
- Validate inputs and handle errors with contextual logs.
- Preserve Spanish-first UX copy.
