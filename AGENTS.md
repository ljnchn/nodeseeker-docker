# AGENTS.md

## Overview

NodeSeeker Docker is a Bun + Hono.js + SQLite RSS monitoring and Telegram push notification system for the NodeSeek community forum. Single fullstack application (not a monorepo).

## Runtime

- **Bun** is the required runtime (not Node.js). All scripts use `bun run`.
- Bun must be installed separately: `curl -fsSL https://bun.sh/install | bash`
- Ensure `~/.bun/bin` is on PATH after installation.

## Build/Lint/Test Commands

| Command | Purpose |
|---------|---------|
| `bun install` | Install dependencies (use Bun, not npm) |
| `bun run dev` | Start dev server with hot reload on port 3010 |
| `bun run build` | Build for production to `dist/` |
| `bun run start` | Run production build |
| `bun run db:migrate` | Run database migrations (idempotent) |
| `bun run db:reset` | Reset database (destructive) |
| `bun test` | Run all tests |
| `bun test src/utils/basic.test.ts` | Run single test file |

## Code Style Guidelines

### Imports
- Use ES modules (`"type": "module"` in package.json)
- Import order: 1) External deps, 2) Internal modules, 3) Types
- Use `import type { Foo } from '...'` for type-only imports
- Example: `import { Hono } from 'hono';` then `import { DatabaseService } from '../services/database';`

### Formatting
- No linter configured - rely on Bun/TypeScript toolchain
- Use 4 spaces for indentation
- Semicolons required
- Trailing commas in multi-line objects/arrays

### Types & Naming
- Use PascalCase for: interfaces, types, classes, enums
- Use camelCase for: variables, functions, methods, properties
- Use UPPER_SNAKE_CASE for: constants, environment variables
- Prefix interfaces with nothing (e.g., `Post`, `BaseConfig`)
- Suffix types with nothing (e.g., `ApiResponse<T>`)

### Error Handling
- Use try/catch with specific error messages
- Always log errors with `logger.error('context:', error)`
- Return structured error responses via `createErrorResponse(message)`
- Use Zod for input validation with `createValidationMiddleware(schema)`

### API Patterns
- Use Hono router with typed context variables
- Middleware pattern for auth: `sessionMiddleware`
- Response helpers: `createSuccessResponse(data, message?)`, `createErrorResponse(message)`
- HTTP status codes: 200 success, 201 created, 400 bad request, 401 unauthorized, 404 not found, 500 server error

### Database
- SQLite via `bun:sqlite`
- Use `DatabaseService` class with query caching (60s TTL)
- Transactions for batch operations
- Clear cache with `clearCacheByPattern()` after mutations

### Logging
- Use `logger` utility with category methods:
  - `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`
  - `logger.rss()`, `logger.telegram()`, `logger.db()`, `logger.match()`
  - `logger.server()`, `logger.scheduler()`
- Set `LOG_LEVEL=debug` for verbose output

### Testing
- Use `bun:test` (Bun's built-in test runner)
- Import: `import { describe, it, expect } from 'bun:test'`
- Place tests alongside source files: `*.test.ts`

## Project Structure

```
src/
├── config/          # Configuration (env, database, server)
├── database/        # Migration scripts
├── routes/          # Hono API routes
├── services/        # Business logic (database, rss, telegram, auth, etc.)
├── components/      # React components
├── types/           # TypeScript type definitions
└── utils/           # Utilities (logger, validation, helpers)
```

## Key Files

- `src/server.ts` - Entry point, starts HTTP server and scheduler
- `src/index.ts` - App initialization
- `src/types/index.ts` - All TypeScript interfaces
- `src/utils/logger.ts` - Structured logging utility
- `src/utils/validation.ts` - Zod schemas and validation middleware
- `src/utils/helpers.ts` - Response helpers

## Environment Variables

Key variables in `.env`:
- `PORT=3010` - Server port
- `HOST=0.0.0.0` - Bind address
- `DATABASE_PATH=./data/nodeseeker.db` - SQLite location
- `RSS_URL=https://rss.nodeseek.com/` - RSS source
- `TELEGRAM_BOT_TOKEN` - Optional bot token
- `LOG_LEVEL=info` - Logging verbosity

## Development Workflow

1. `bun install` - Install deps
2. `bun run db:migrate` - Setup database (idempotent)
3. `bun run dev` - Start dev server
4. Create admin account via UI or `POST /auth/register`
5. Access app at http://localhost:3010

## Caveats

- Always use `bun install` (not npm) - project has both lockfiles
- Database is SQLite at `./data/nodeseeker.db`
- Restart dev server after `bun install` (hot reload doesn't catch new deps)
- RSS cron fetches every minute automatically in dev mode
- Telegram Bot Token is optional for basic dev usage
- No ESLint/Biome - type checking happens at build time
