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

### Adding a React component

1. Create component in `apps/web/src/`
2. Create test file as `ComponentName.test.tsx` alongside it
3. Use functional components with TypeScript interfaces for props

### Full validation

Run `bash scripts/validate.sh` to check formatting, lint, tests, and builds before submitting changes.
