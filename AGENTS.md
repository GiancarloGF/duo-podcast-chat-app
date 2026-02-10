# Relatos en Ingles - Agent Playbook

## Purpose and Scope
- This is a Next.js 16 + React 19 app for English practice through stories and phrasal verbs.
- Main data backends: MongoDB (stories/progress), Firebase Auth, Firestore (`phrasal_verbs`), Gemini for feedback.
- Use `pnpm` only. Do not use `npm` or `yarn`.
- Prefer Spanish copy in UI unless the surrounding screen is already English-first.

## Rule Sources (Cursor/Copilot)
- Primary rule source: this `AGENTS.md`.
- Cursor rules:
  - `.cursorrules`: not present.
  - `.cursor/rules/`: not present.
- Copilot rules:
  - `.github/copilot-instructions.md`: not present.
- If any of those files are added later, merge them here and follow the most specific rule.

## Core Commands
- Install deps: `pnpm install`
- Dev server: `pnpm dev`
- Production build: `pnpm build`
- Start production server: `pnpm start`
- Lint: `pnpm lint`
- Lint autofix: `pnpm lint --fix`
- Type-check (recommended, since build ignores TS errors): `pnpm exec tsc --noEmit`

## Test Commands (Current State + Single-Test Guidance)
- Current state:
  - No `test` script in `package.json`.
  - No test runner config is checked in.
  - No `*.test.*` / `*.spec.*` files found.
- If Vitest is added, recommended scripts:
  - `"test": "vitest run"`
  - `"test:watch": "vitest"`
- Single-file test (Vitest): `pnpm vitest run path/to/file.test.ts`
- Single test by name (Vitest): `pnpm vitest run path/to/file.test.ts -t "test name"`
- If Playwright is added, single spec: `pnpm playwright test tests/e2e/example.spec.ts`

## Architecture Overview
- App router: `src/app`
- Feature routes:
  - `src/app/(features)/stories/page.tsx`
  - `src/app/(features)/stories/chat/[userProgressId]/page.tsx`
  - `src/app/(features)/phrasal-verbs/page.tsx`
  - `src/app/(features)/phrasal-verbs/practice/page.tsx`
  - `src/app/(features)/phrasal-verbs/practice/session/page.tsx`
- API routes: `src/app/api/**/route.ts`
- Feature modules follow layers: `domain`, `application`, `infrastructure`, `presentation`
- Shared UI/utilities: `src/shared/**`

## Imports and Module Boundaries
- Prefer aliases over deep relative paths:
  - `@/*`, `@/features/*`, `@/shared/*`
- Import order:
  1) framework / third-party
  2) internal alias imports
  3) same-folder relative imports
- Use `import type` for type-only imports.
- Avoid circular imports across layers.
- Keep presentation logic out of infrastructure unless already established by local pattern.

## Formatting and Styling Conventions
- Follow existing file style; do not reformat unrelated lines.
- Repo has mixed style:
  - many feature/server files use semicolons
  - many shadcn-style UI files omit semicolons
- Match the file’s existing quote and semicolon style.
- Keep className strings readable and stable; avoid class churn.
- Use `cn` from `@/shared/presentation/utils` for conditional classes.

## TypeScript Rules
- `strict: true` is enabled; keep strict typing.
- Explicitly type exported function return values.
- Avoid `any`; use entities/DTOs/interfaces.
- Convert Mongo `_id` to string before server-client boundary crossing.
- Use schema parsing (e.g., `zod`) where already established.
- Do not rely on `pnpm build` alone for type safety (`ignoreBuildErrors` is true).

## Naming Conventions
- Components: PascalCase (`EpisodeCard`, `PhrasalVerbsExplorer`)
- Hooks: `useX` (`useUserSession`)
- Use cases: verb-based PascalCase files (`GetStories.usecase.ts`)
- Server actions: descriptive camelCase (`startChatByEpisode`)
- Interfaces/types: PascalCase with domain clarity (`TranslationFeedback`)
- Constants: `UPPER_SNAKE_CASE` only for true constants

## Next.js / React Practices
- Add `'use client'` only where hooks/browser APIs are required.
- Keep server components hook-free.
- Server actions should live in feature `presentation/actions.ts` with `'use server'`.
- Use `revalidatePath` for mutations affecting server-rendered data.
- Keep optimistic updates paired with clear rollback/error states.
- For query-parameter driven pages, prefer server page `searchParams` and pass to client components when possible.

## Data Access Rules
- Mongo:
  - Always call `await dbConnect()` before model access.
  - Use model getters in `src/shared/infrastructure/database/mongo/models/*`.
  - Avoid ad-hoc global `mongoose.model(...)` declarations.
  - Convert string ids with `new mongoose.Types.ObjectId(...)` for `_id` queries.
- Firestore:
  - Phrasal verbs live in collection `phrasal_verbs`.
  - Normalize user-facing taxonomy values (trim/case) before matching.

## Error Handling and Logging
- Validate required input early.
- API responses:
  - `400` for client/input errors
  - `500` for unexpected/infrastructure errors
- Keep JSON response shape consistent: `success`, `error`, optional `details`.
- Include context in logs (`episodeId`, `userProgressId`, operation).
- Use `console.warn` for recoverable paths, `console.error` for hard failures.
- Never log secrets, tokens, or full provider payloads.

## UX and Copy Guidelines
- Spanish-first labels, helper text, and feedback messages.
- Keep terminology consistent (`Atras`, `Siguiente`, `Practicar`, `Categoria`).
- Preserve app visual language (brutalist borders, hard shadows, strong hierarchy).
- Ensure mobile-safe spacing and responsive layouts.

## Environment and Secrets
- Expected env vars:
  - `MONGODB_URI`
  - `GEMINI_API_KEY`
  - Firebase public vars (`NEXT_PUBLIC_FIREBASE_*`) for auth/firestore clients
- Script examples with env:
  - `node --env-file=.env.local scripts/seed-episodes.mjs`
  - `node --env-file=.env.local scripts/cleanup-episodes.mjs`
  - `node --env-file=.env.local scripts/update-episode-titles.mjs`

## Operational Caveats
- `next.config.mjs` has `typescript.ignoreBuildErrors: true`.
- Build may pass while TypeScript still fails.
- Run both `pnpm lint` and `pnpm exec tsc --noEmit` before merging significant changes.

## Manual QA Checklist
- `/stories`: section counts and card grouping render correctly.
- Story chat flow: start episode, submit translation, feedback displays.
- Progress persistence: reload chat URL and verify continuity.
- `/phrasal-verbs`: filters, search, pagination, modal behavior.
- `/phrasal-verbs/practice`: supergroup -> group -> category selection flow + breadcrumb backtracking.
- `/phrasal-verbs/practice/session`: receives selected category and lists matching PVs.

## PR Delivery Checklist
- Keep PRs scoped (feature work separate from broad refactors).
- Include manual QA notes if no automated tests exist.
- Update this file when adding/changing test tooling or single-test commands.
- Do not commit secrets or `.env` files.

## Quick Agent Checklist
- Use `pnpm` only.
- Follow existing file-local formatting.
- Prefer alias imports and `import type`.
- Keep strict types and explicit returns.
- Validate inputs and handle errors consistently.
- Preserve Spanish-first UX unless context dictates otherwise.
