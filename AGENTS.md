# AGENTS.md

## Project Overview

"Relatos en Inglés" - A Next.js 16 app for learning English through Spanish-to-English translation practice using podcast transcripts. Users translate Spanish messages and receive AI-powered feedback from Google Gemini.

## Commands

```powershell
pnpm dev       # Start development server
pnpm build     # Build for production
pnpm start     # Start production server
pnpm lint      # Run ESLint
```

## Environment Variables

Required in `.env.local`:
- `GEMINI_API_KEY` - Google Gemini API key
- `MONGODB_URI` - MongoDB connection string (defaults to `mongodb://localhost:27017/podcast-chat`)

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with shadcn/ui (new-york style)
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini (`@google/genai`) with Zod schemas for structured JSON output
- **Package Manager**: pnpm

## Architecture

### Data Flow
1. **Episode content** is stored in MongoDB `master_data` database
2. **User progress** is stored in MongoDB `chat-app` database (separate DB)
3. Server Components fetch data at request time (`force-dynamic`)
4. Server Actions handle mutations (starting episodes, submitting translations, updating progress)
5. API Routes handle AI interactions (Gemini feedback generation)

### Key Directories

- `app/` - Next.js App Router
  - `page.tsx` - Home page listing episodes by status (In Progress, Completed, Available)
  - `chat/[userProgressId]/page.tsx` - Translation practice chat interface
  - `api/` - API routes for AI feedback and episode data

- `lib/` - Core business logic
  - `db/conection.ts` - MongoDB connection with caching for hot reload
  - `db/models/` - Mongoose schemas (Episode, UserProgress, SavedWord, User)
  - `actions/` - Server Actions for data mutations
  - `gemini-service.ts` - Gemini AI client with structured output (Zod → JSON Schema)
  - `types.ts` - TypeScript interfaces for the domain

- `components/` - React components
  - `ui/` - shadcn/ui primitives
  - `chat/` - Chat UI (MessageBubble, TranslationInput, FeedbackModal)
  - `home/` - Episode cards and home page components

### Database Models

Episode and UserProgress use different databases via `mongoose.connection.useDb()`:
- `getEpisodeModel()` → connects to `master_data.episodes`
- `getUserProgressModel()` → connects to `chat-app.userprogresses`

### AI Integration Pattern

Translation feedback uses structured JSON output:
1. `lib/feedback-schema.ts` defines Zod schema for feedback structure
2. `lib/gemini-service.ts` converts Zod → JSON Schema via `zodToJsonSchema`
3. Gemini returns type-safe JSON matching the schema
4. Response is validated with `feedbackSchema.parse()`

### Path Aliases

Configured in `tsconfig.json`: `@/*` maps to root (e.g., `@/lib/types`, `@/components/ui/button`)

## Conventions

- Server Actions are prefixed with `'use server'` and live in `lib/actions/`
- Components using hooks or browser APIs are marked `'use client'`
- UI components use shadcn/ui patterns (Radix primitives + Tailwind + class-variance-authority)
- User identification currently uses a fake user ID (`CONSTANTS.FAKE_USER_ID`) - no auth implemented yet
