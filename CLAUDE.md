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
