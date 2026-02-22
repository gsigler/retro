---
name: scaffold-app
description: Scaffold a brand-new monorepo application from scratch with the full tech stack. Use when the user wants to create a new project, bootstrap a new app, or start a new monorepo.
argument-hint: <project-name>
disable-model-invocation: true
context: fork
---

# Scaffold App

Scaffold a brand-new monorepo application from scratch with the full tech stack. Ask for the **project name** if not provided as `$ARGUMENTS`.

The goal is a working, runnable monorepo with all tooling wired up — not a domain-specific app. The scaffolded project should include a health-check API endpoint, a landing page, and passing tests so the developer can verify everything works immediately.

Read all reference files in this skill directory before starting:
- `stack-reference.md` — exact versions, configs, and package.json shapes
- `api-source-files.md` — NestJS source file templates
- `web-source-files.md` — React/Vite source file templates

---

## Step 1: Initialize the monorepo root

Create the project directory and initialize git. Create these files using the exact configs from `stack-reference.md`:

1. `package.json` — use `$ARGUMENTS` as the project name
2. `tsconfig.base.json`
3. `.prettierrc`
4. `eslint.config.mjs` (root)
5. `.gitignore`
6. `.husky/pre-commit` containing `npx lint-staged`

## Step 2: Create the API app (`apps/api`)

Follow `stack-reference.md` for `package.json`, `tsconfig.json`, `nest-cli.json`, and Prisma setup.
Follow `api-source-files.md` for all source files under `apps/api/src/`.

Key points:
- Uses **Zod + nestjs-zod** (NOT class-validator/class-transformer)
- Uses **@sentry/nestjs** (opt-in via `SENTRY_DSN` env var)
- Uses **Passport + Google OAuth + JWT** for auth
- Global `ZodValidationPipe` (not `ValidationPipe`)
- Prisma 7 with `prisma-client` generator and `@prisma/adapter-pg`
- `apps/api/.env` is a symlink to `../../.env`
- ESM: `"type": "module"` with `.js` extension imports

Create test files:
- `app.controller.spec.ts` — test health check
- `auth/auth.service.spec.ts` — test with mocked Prisma and JWT
- `auth/auth.controller.spec.ts` — test controller methods exist

## Step 3: Create the Web app (`apps/web`)

Follow `stack-reference.md` for `package.json`, TypeScript configs, and Vite config.
Follow `web-source-files.md` for all source files under `apps/web/src/`.

Key points:
- React 19, Vite 7, Tailwind CSS 4 (via `@tailwindcss/vite`)
- **shadcn/ui** with `components.json`, CSS variables, `cn()` utility, Button component pre-installed
- **@sentry/react** + `@sentry/vite-plugin` (opt-in via `VITE_SENTRY_DSN`)
- **TanStack React Query** for data fetching
- **react-hook-form + @hookform/resolvers** for Zod form validation
- Path alias: `@/` → `./src/`
- ESLint: extends root + react-hooks + react-refresh

Create test file:
- `src/App.test.tsx` — basic render test

## Step 4: Docker + infrastructure

Create using specs from `stack-reference.md`:
- `docker-compose.yml` — PostgreSQL 16, API, and Web services
- `apps/api/Dockerfile` — 3-stage (deps → build → production with node:22-alpine)
- `apps/web/Dockerfile` — 3-stage (deps → build → nginx:alpine)
- `apps/web/nginx.conf` — gzip, asset caching, SPA fallback

## Step 5: Scripts

- `scripts/dev.mjs` — port detection, docker db, concurrently
- `scripts/validate.sh` — format, lint, generate, test, build (make executable)

## Step 6: Environment files

- `.env.example` — all env vars documented
- `.env` — copy from `.env.example`, fill in DATABASE_URL with project name
- `apps/api/.env` — symlink to `../../.env`

## Step 7: Install and verify

1. `npm install` from monorepo root
2. `npm run db:generate`
3. `npm run test:api` — must pass
4. `npm run test:web` — must pass
5. `npm run build:api` — must succeed
6. `npm run build:web` — must succeed
7. `npm run format:check` — must pass
8. `npm run lint` — must pass

Fix any issues until all checks pass.

## Step 8: Initial commit

Create a git commit: `feat: scaffold <project> monorepo`

Include all files. Do NOT push.
