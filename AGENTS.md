# AGENTS.md

## Cursor Cloud specific instructions

### Overview

NodeSeeker Docker is a Bun + Hono.js + SQLite RSS monitoring and Telegram push notification system for the NodeSeek community forum. It is a single fullstack application (not a monorepo).

### Runtime

- **Bun** is the required runtime (not Node.js). All scripts in `package.json` use `bun run`.
- Bun must be installed separately (`curl -fsSL https://bun.sh/install | bash`); it is not included in the default system image.
- After installing Bun, ensure `~/.bun/bin` is on `PATH`.

### Development commands

See `package.json` scripts and `README.md` "开发命令" section. Key commands:

| Command | Purpose |
|---|---|
| `bun install` | Install dependencies |
| `bun run db:migrate` | Run database migrations (idempotent) |
| `bun run dev` | Start dev server with hot reload on port 3010 |
| `bun run build` | Build for production |
| `bun test` | Run tests |

### Caveats and gotchas

- The project has both `package-lock.json` and a Bun lockfile. Always use `bun install` (not `npm install`) to stay consistent with the runtime.
- Database is embedded SQLite at `./data/nodeseeker.db`. No external database service needed.
- `bun run db:migrate` is idempotent and safe to run multiple times.
- The `.env` file already exists in the repo with development defaults. No secrets are required for basic dev usage. Telegram Bot Token is optional.
- The dev server (`bun run dev`) uses `--hot` for hot reloading. After dependency changes (`bun install`), you must restart the dev server.
- First-time app usage requires creating an admin account via the UI or `POST /auth/register` API.
- The RSS cron job starts automatically with the dev server and fetches from `https://rss.nodeseek.com/` every minute. This requires internet access.
- No linter (ESLint/Biome) is configured in the project. Type checking is done implicitly by the Bun/TypeScript toolchain at build time.
