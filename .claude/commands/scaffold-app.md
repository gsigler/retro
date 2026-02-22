Scaffold a brand-new monorepo application from scratch with the full tech stack. Ask for the **project name** if not provided as $ARGUMENTS.

The goal is a working, runnable monorepo with all tooling wired up — not a domain-specific app. The scaffolded project should include a health-check API endpoint, a landing page, and passing tests so the developer can verify everything works immediately.

---

## Tech Stack Reference

Use these exact versions and patterns. Do NOT deviate.

### Monorepo structure

```
<project>/
├── apps/
│   ├── api/          # NestJS backend (@<project>/api)
│   └── web/          # React/Vite frontend (@<project>/web)
├── package.json      # Root: workspaces, hoisted devDeps, convenience scripts
├── tsconfig.base.json
├── eslint.config.mjs
├── .prettierrc
├── docker-compose.yml
├── .env.example
├── .gitignore
├── .husky/pre-commit
└── scripts/
    ├── dev.mjs
    └── validate.sh
```

### Root package.json

- `"workspaces": ["apps/*"]`
- Hoisted devDependencies: `@eslint/js`, `concurrently`, `detect-port`, `eslint`, `eslint-config-prettier`, `globals`, `husky`, `lint-staged`, `prettier`, `typescript (~5.9)`, `typescript-eslint`
- Scripts: `dev`, `dev:api`, `dev:web`, `build:api`, `build:web`, `test:api`, `test:web`, `lint`, `lint:fix`, `format`, `format:check`, `db:generate`, `db:migrate:dev`, `db:migrate:deploy`, `db:studio`, `docker:up`, `docker:down`, `docker:build`, `prepare` (husky)
- lint-staged config targeting `apps/**/src/**/*.{ts,tsx}` and `apps/**/test/**/*.ts`

### Prettier (.prettierrc)

```json
{ "singleQuote": true, "trailingComma": "all", "semi": false }
```

### ESLint (flat config)

- Root `eslint.config.mjs`: `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-config-prettier`. Rules: `@typescript-eslint/no-explicit-any: off`, `@typescript-eslint/no-unused-vars: ['warn', { argsIgnorePattern: '^_' }]`
- API `eslint.config.mjs`: extends root + `recommendedTypeChecked`, node+jest globals, `parserOptions.projectService: true`. Rules: `no-floating-promises: warn`, `no-unsafe-argument: warn`
- Web `eslint.config.js`: extends root + `react-hooks` flat recommended + `react-refresh` vite config, browser globals

### TypeScript

- `tsconfig.base.json`: target ES2022, module ESNext, moduleResolution bundler, strict, esModuleInterop, skipLibCheck, declaration, declarationMap, sourceMap
- API `tsconfig.json`: extends base, module nodenext, moduleResolution nodenext, emitDecoratorMetadata, experimentalDecorators, target ES2023, outDir ./dist, incremental
- Web `tsconfig.json`: project references to `tsconfig.app.json` + `tsconfig.node.json`
- Web `tsconfig.app.json`: extends base, jsx react-jsx, noEmit, verbatimModuleSyntax, paths `@/*` → `./src/*`
- Web `tsconfig.node.json`: target ES2023, module ESNext, noEmit, verbatimModuleSyntax, includes only `vite.config.ts`

---

## Step 1: Initialize the monorepo root

Create the project directory. Initialize git. Create:

1. `package.json` — use the project name, `"private": true`, workspaces, scripts, and hoisted devDependencies as listed above
2. `tsconfig.base.json`
3. `.prettierrc`
4. `eslint.config.mjs`
5. `.gitignore` — include: `node_modules`, `dist`, `.env`, `.turbo`, `coverage`, `*.tsbuildinfo`, `.env.local`, `generated/`
6. `.husky/pre-commit` containing `npx lint-staged`

---

## Step 2: Create the API app (`apps/api`)

### package.json

- Name: `@<project>/api`
- `"type": "module"`
- Scripts: `build`, `start`, `start:dev`, `start:debug`, `start:prod`, `lint`, `test`, `test:watch`, `test:cov`, `prisma:generate`, `prisma:migrate:dev`, `prisma:migrate:deploy`, `prisma:studio`
- Dependencies:
  - NestJS: `@nestjs/common`, `@nestjs/core`, `@nestjs/config`, `@nestjs/platform-express`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/throttler`, `@nestjs/websockets`, `@nestjs/platform-socket.io`
  - Auth: `passport`, `passport-google-oauth20`, `passport-jwt`
  - Database: `@prisma/client`, `@prisma/adapter-pg`
  - Validation: `zod`, `nestjs-zod` (NOT class-validator/class-transformer)
  - Monitoring: `@sentry/nestjs`
  - Other: `dotenv`, `nanoid`, `reflect-metadata`, `rxjs`, `socket.io`
- DevDependencies:
  - `@nestjs/cli`, `@nestjs/schematics`, `@nestjs/testing`
  - `@types/express`, `@types/jest`, `@types/node`, `@types/passport-google-oauth20`, `@types/passport-jwt`, `@types/supertest`
  - `jest`, `supertest`, `prisma`, `source-map-support`
  - `@swc/core`, `@swc/jest`
- Jest config (inline in package.json):
  - moduleFileExtensions: js, json, ts
  - rootDir: src
  - testRegex: `.*\\.spec\\.ts$`
  - transform: `@swc/jest` with decorator support (`jsc.parser.decorators: true`, `jsc.transform.legacyDecorator: true`, `decoratorMetadata: true`)
  - moduleNameMapper: `"^(\\.{1,2}/.*)\\.js$": "$1"`
  - testEnvironment: node

### nest-cli.json

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true, "preserveWatchOutput": true }
}
```

### Prisma setup

1. `prisma/schema.prisma` — use `prisma-client` generator with `output = "../generated/prisma"`, PostgreSQL datasource, and a single `User` model:
   ```prisma
   model User {
     id        String   @id @default(cuid())
     email     String   @unique
     name      String?
     googleId  String?  @unique
     avatarUrl String?
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```
2. `prisma.config.ts` — import `dotenv/config`, use `defineConfig` from `prisma/config`
3. Symlink `.env` from monorepo root: the root `.env` should be the source of truth; `apps/api/.env` should be a symlink to `../../.env`

### Source files

Create the following source structure under `apps/api/src/`:

**main.ts** — Bootstrap NestJS with:
- Sentry integration: `const { httpHandler } = SentryNestInstrumentation.init({ dsn: process.env.SENTRY_DSN })` — only if `SENTRY_DSN` is set
- CORS enabled via `ConfigService` reading `APP_URL`
- Global `ZodValidationPipe` from `nestjs-zod` (NOT `ValidationPipe` from `@nestjs/common`)
- Listen on `process.env.PORT ?? 3000`

**app.module.ts** — Register:
- `ConfigModule.forRoot({ isGlobal: true })`
- `ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])`
- `SentryModule.forRoot()` (from `@sentry/nestjs`)
- `PrismaModule`
- `AuthModule`
- Global `ThrottlerGuard` via `APP_GUARD`
- `AppController` + `AppService`

**app.controller.ts** — Single `GET /` health check returning `{ status: 'ok' }`

**app.service.ts** — `getHealth()` returning `{ status: 'ok' }`

**prisma/prisma.module.ts** — `@Global()` module exporting `PrismaService`

**prisma/prisma.service.ts** — Injectable service using `PrismaPg` adapter from `@prisma/adapter-pg`:
```typescript
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private _client!: PrismaClient

  get client(): PrismaClient {
    return this._client
  }

  async onModuleInit() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
    this._client = new PrismaClient({ adapter })
    await this._client.$connect()
  }

  async onModuleDestroy() {
    await this._client?.$disconnect()
  }
}
```

**auth/auth.module.ts** — Imports `PassportModule`, `JwtModule.registerAsync` (secret from `JWT_SECRET`, expiration from `JWT_EXPIRATION` defaulting to `7d`). Providers: `AuthService`, `GoogleStrategy`, `JwtStrategy`. Exports: `AuthService`.

**auth/auth.service.ts** — `findOrCreateGoogleUser(profile)` upserting user via Prisma and signing JWT. `getProfile(userId)` returning user without sensitive fields.

**auth/auth.controller.ts** — Three endpoints:
- `GET /auth/google` — GoogleAuthGuard redirects to Google
- `GET /auth/google/callback` — GoogleAuthGuard, calls findOrCreateGoogleUser, redirects to `APP_URL/auth/callback?token=...`
- `GET /auth/profile` — JwtAuthGuard, returns profile

**auth/guards/jwt-auth.guard.ts** — `extends AuthGuard('jwt')`

**auth/guards/google-auth.guard.ts** — `extends AuthGuard('google')`

**auth/strategies/jwt.strategy.ts** — Extract bearer token, validate, return `{ id: payload.sub, email: payload.email }`

**auth/strategies/google.strategy.ts** — Google OAuth strategy with `clientID`, `clientSecret`, `callbackURL` from config, `scope: ['email', 'profile']`

**auth/dto/example.dto.ts** — One example Zod DTO to demonstrate the pattern:
```typescript
import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export class LoginDto extends createZodDto(loginSchema) {}
```

### Test files

- `app.controller.spec.ts` — test the health check endpoint
- `auth/auth.service.spec.ts` — test `findOrCreateGoogleUser` and `getProfile` with mocked Prisma and JWT services
- `auth/auth.controller.spec.ts` — test controller method existence

---

## Step 3: Create the Web app (`apps/web`)

### package.json

- Name: `@<project>/web`
- `"type": "module"`
- Scripts: `dev` (vite --clearScreen false), `build` (tsc -b && vite build), `lint`, `preview`, `test` (vitest run)
- Dependencies:
  - React: `react`, `react-dom` (^19)
  - Routing: `react-router` (^7)
  - Data fetching: `@tanstack/react-query`
  - UI: `tailwindcss` (^4), `@tailwindcss/vite`, `lucide-react`
  - shadcn/ui: `class-variance-authority`, `clsx`, `tailwind-merge`
  - Socket: `socket.io-client`
  - Monitoring: `@sentry/react`
  - Forms (for Zod integration): `react-hook-form`, `@hookform/resolvers`
  - Testing: `@testing-library/user-event`
- DevDependencies:
  - `@testing-library/jest-dom`, `@testing-library/react`
  - `@types/node`, `@types/react`, `@types/react-dom`
  - `@vitejs/plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
  - `jsdom`, `vite` (^7), `vitest`

### Vite config (`vite.config.ts`)

```typescript
/// <reference types="vitest/config" />
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [sentryVitePlugin({ org: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT })]
      : []),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: { sourcemap: true },
  test: { environment: 'jsdom', globals: true },
})
```

### index.html

Standard Vite HTML entry. Include Google Fonts preconnect for `JetBrains Mono` and `Fira Code`.

### Source files

**src/index.css** — `@import 'tailwindcss'` plus base resets and CSS custom properties for shadcn/ui theming:
```css
@import 'tailwindcss';

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

**src/lib/utils.ts** — shadcn/ui utility:
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**src/lib/api.ts** — Typed fetch wrapper reading `VITE_API_URL`, adding `Content-Type: application/json` and `Authorization: Bearer` headers.

**src/main.tsx** — Wrap app in `StrictMode`, `QueryClientProvider`, `BrowserRouter`, `AuthProvider`. Initialize Sentry if `VITE_SENTRY_DSN` is set.

**src/App.tsx** — Basic routes:
- `/` — Landing page
- `/login` — Login page
- `/auth/callback` — Auth callback page
- `/dashboard` — Protected route placeholder

**src/contexts/AuthContext.tsx** — Auth context with `user`, `token`, `isLoading`, `login(token)`, `logout()`. Stores JWT in localStorage. Fetches `/auth/profile` on mount.

**src/components/ProtectedRoute.tsx** — Redirects to `/login` if not authenticated.

**src/components/ui/button.tsx** — shadcn/ui Button component using `class-variance-authority`:
```typescript
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

Add `@radix-ui/react-slot` to web dependencies for the Button component.

**src/pages/LandingPage.tsx** — Simple landing with a "Get Started" button linking to `/login`

**src/pages/LoginPage.tsx** — "Sign in with Google" button that redirects to `VITE_API_URL/auth/google`

**src/pages/AuthCallbackPage.tsx** — Reads `token` from URL params, calls `login(token)`, redirects to `/dashboard`

**src/pages/DashboardPage.tsx** — Shows "Welcome, {user.name}" with a logout button

### Test files

- `src/App.test.tsx` — basic render test

### shadcn/ui config

Create a `components.json` at `apps/web/` root for shadcn CLI compatibility:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

## Step 4: Docker + infrastructure

### docker-compose.yml

- `db` service: `postgres:16-alpine`, port 5432, healthcheck with `pg_isready`
- `api` service: build from `apps/api/Dockerfile`, depends on db, volume-mount source for dev, `DATABASE_URL` pointing to `db:5432`
- `web` service: build from `apps/web/Dockerfile`, vite dev server with `--host 0.0.0.0`

### Dockerfiles

- `apps/api/Dockerfile` — 3-stage: deps (node:22-alpine, `npm ci`), build (prisma generate + nest build), production (node:22-alpine, `npm ci --omit=dev`, prisma migrate deploy + node dist)
- `apps/web/Dockerfile` — 3-stage: deps, build (vite build with `VITE_API_URL` arg), production (nginx:alpine, SPA fallback)
- `apps/web/nginx.conf` — gzip, asset caching, SPA `try_files` fallback

---

## Step 5: Scripts

### scripts/dev.mjs

```javascript
import { execSync, spawn } from 'node:child_process'
import detect from 'detect-port'

const apiPort = await detect(3000)
const webPort = await detect(5173)

console.log(`Starting API on port ${apiPort}, Web on port ${webPort}`)

execSync('docker compose up -d --wait db', { stdio: 'inherit' })
execSync('prisma generate --schema apps/api/prisma/schema.prisma', { stdio: 'inherit' })

const api = `PORT=${apiPort} nest start -w -c apps/api/nest-cli.json -p apps/api/tsconfig.json --preserveWatchOutput`
const web = `VITE_API_URL=http://localhost:${apiPort} vite apps/web --clearScreen false --port ${webPort}`

spawn('concurrently', ['-n', 'api,web', '-c', 'blue,magenta', api, web], {
  stdio: 'inherit',
}).on('exit', (code) => process.exit(code ?? 0))
```

### scripts/validate.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== Format Check ===" && npm run format:check
echo "=== Lint ===" && npm run lint
echo "=== Generate Prisma Client ===" && npm run db:generate
echo "=== API Tests ===" && npm run test:api
echo "=== Web Tests ===" && npm run test:web
echo "=== Build API ===" && npm run build:api
echo "=== Build Web ===" && npm run build:web
echo "All checks passed."
```

Make `scripts/validate.sh` executable.

---

## Step 6: Environment files

### .env.example

```
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/<project>?schema=public

# API
PORT=3000
NODE_ENV=development

# Auth
JWT_SECRET=
JWT_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Web
VITE_API_URL=http://localhost:3000
APP_URL=http://localhost:5173

# Sentry (optional)
SENTRY_DSN=
VITE_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

Copy `.env.example` to `.env` and fill in the database URL with the project name. Create the symlink `apps/api/.env -> ../../.env`.

---

## Step 7: Install and verify

1. Run `npm install` from the monorepo root
2. Run `npm run db:generate` to generate the Prisma client
3. Run `npm run test:api` — all tests must pass
4. Run `npm run test:web` — all tests must pass
5. Run `npm run build:api` — must succeed
6. Run `npm run build:web` — must succeed
7. Run `npm run format:check` — must pass
8. Run `npm run lint` — must pass

Fix any issues until all checks pass.

---

## Step 8: Initial commit

Create an initial git commit with message: `feat: scaffold <project> monorepo`

Include all files. Do NOT push — leave that to the developer.

---

## Key Differences from class-validator

The scaffolded project uses **Zod + nestjs-zod** instead of class-validator/class-transformer:

- Global pipe: `ZodValidationPipe` from `nestjs-zod` (not `ValidationPipe` from `@nestjs/common`)
- DTOs: `createZodDto(zodSchema)` pattern (not decorator-based classes)
- No `class-transformer` or `class-validator` packages at all
- Validation errors are automatically formatted by nestjs-zod

## Sentry Integration Notes

- API: `@sentry/nestjs` provides `SentryModule.forRoot()` and performance instrumentation
- Web: `@sentry/react` wraps the app with `Sentry.init()` in main.tsx
- Both are **opt-in**: only initialized if `SENTRY_DSN` / `VITE_SENTRY_DSN` env vars are set
- Source maps are uploaded via `@sentry/vite-plugin` only if `SENTRY_AUTH_TOKEN` is set
