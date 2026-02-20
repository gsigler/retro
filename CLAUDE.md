# Retro - Project Guidelines

## Structure

NestJS + React monorepo using npm workspaces.

- `apps/api` — NestJS backend (`@retro/api`)
- `apps/web` — React/Vite frontend (`@retro/web`)
- `tsconfig.base.json` — shared TypeScript config (apps extend this)

## Conventions

- Root `package.json` has convenience scripts: `dev`, `dev:api`, `dev:web`, `build:api`, `build:web`, `test:api`, `test:web`
- Common dev dependencies (ESLint, Prettier, TypeScript, testing) are hoisted to root
- ESLint uses flat config (`eslint.config.mjs`); per-app configs extend root and add framework-specific rules
- Always run `npm install` from the monorepo root

## Code Style

- Prettier: `singleQuote: true`, `trailingComma: "all"`, `semi: false`
- Strict TypeScript settings

## Development

- `npm run dev` starts both frontend and backend via `concurrently`
- Always include tests when scaffolding new features
- Run tests, builds, and dev servers regularly to catch issues early

## Concurrently Gotchas

- Use `--clearScreen false` with Vite commands
- Set `preserveWatchOutput: true` in `nest-cli.json` compilerOptions
- Prefer invoking binaries directly (`npx` or `node_modules/.bin/`) rather than `npm run -w` inside concurrently commands
- Use `-n` for named prefixes and `-c` for colored output

## API Response DTOs

- Controllers must never return raw Prisma objects. Every controller method should have a typed return annotation and map results through a response DTO.
- Response DTOs live alongside input DTOs in `<module>/dto/` (e.g. `team-response.dto.ts`).
- Each DTO is a plain class with a static `from()` factory that maps Prisma results to a known shape. No decorators or interceptors needed.
- Use `select` in Prisma queries for nested relations (e.g. user fields) to avoid leaking sensitive fields like `googleId`.

## Common Workflows

### Adding a new API endpoint

1. Generate NestJS module: `npx -w @retro/api nest g module <name>`
2. Generate controller: `npx -w @retro/api nest g controller <name>`
3. Generate service: `npx -w @retro/api nest g service <name>`
4. Add unit tests in `<name>.service.spec.ts` and `<name>.controller.spec.ts`
5. Register the module in `app.module.ts`

### Adding a Prisma model

1. Edit `apps/api/prisma/schema.prisma`
2. Run `npm run db:migrate:dev` to create a migration
3. Run `npm run db:generate` to regenerate the Prisma client
4. Create a corresponding NestJS service to wrap Prisma operations

### Prisma in non-interactive environments (Claude Code)

- The `.env` file lives at the monorepo root. `apps/api/.env` is a symlink to it so Prisma auto-loads it.
- Prisma blocks `migrate dev` in non-TTY shells. Use `--force` and `--name` to skip interactive prompts:
  ```
  npx -w @retro/api prisma migrate dev --name <migration_name> --force
  ```
- `PRISMA_MIGRATE_SKIP_GENERATE` — env var to skip `prisma generate` after migrating
- `PRISMA_MIGRATE_SKIP_SEED` — env var to skip seeding after migrating

### Adding a React component

1. Create component in `apps/web/src/`
2. Create test file as `ComponentName.test.tsx` alongside it
3. Use functional components with TypeScript interfaces for props
4. Use TanStack React Query (`useQuery`) for data fetching — not raw `useEffect` + `useState`
5. After mutations, call `queryClient.invalidateQueries()` to keep related data fresh

### Full validation

Run `bash scripts/validate.sh` to check formatting, lint, tests, and builds before submitting changes.
