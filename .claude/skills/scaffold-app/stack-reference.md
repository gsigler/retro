# Stack Reference

Exact configs, versions, and package shapes for scaffolded projects. Replace `<project>` with the actual project name throughout.

---

## Root package.json

```json
{
  "name": "<project>",
  "version": "0.0.1",
  "private": true,
  "description": "",
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "node scripts/dev.mjs",
    "dev:api": "npm run start:dev -w @<project>/api",
    "dev:web": "npm run dev -w @<project>/web",
    "build:api": "npm run build -w @<project>/api",
    "build:web": "npm run build -w @<project>/web",
    "test:api": "npm test -w @<project>/api",
    "test:web": "npm test -w @<project>/web",
    "lint": "eslint apps/api && eslint apps/web",
    "lint:fix": "eslint apps/api --fix && eslint apps/web --fix",
    "format": "prettier --write \"apps/**/src/**/*.{ts,tsx}\" \"apps/**/test/**/*.ts\"",
    "format:check": "prettier --check \"apps/**/src/**/*.{ts,tsx}\" \"apps/**/test/**/*.ts\"",
    "db:generate": "npm run prisma:generate -w @<project>/api",
    "db:migrate:dev": "npm run prisma:migrate:dev -w @<project>/api",
    "db:migrate:deploy": "npm run prisma:migrate:deploy -w @<project>/api",
    "db:studio": "npm run prisma:studio -w @<project>/api",
    "docker:up": "docker compose up -d",
    "docker:down": "docker compose down",
    "docker:build": "docker compose build",
    "prepare": "husky"
  },
  "lint-staged": {
    "apps/**/src/**/*.{ts,tsx}": ["prettier --write", "eslint --fix"],
    "apps/**/test/**/*.ts": ["prettier --write"]
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "concurrently": "^9.2.1",
    "detect-port": "^2.1.0",
    "eslint": "^9.39.1",
    "eslint-config-prettier": "^10.0.1",
    "globals": "^16.5.0",
    "husky": "^9.1.7",
    "lint-staged": "^16.2.7",
    "prettier": "^3.4.2",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.48.0"
  }
}
```

---

## tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

---

## .prettierrc

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": false
}
```

---

## Root eslint.config.mjs

```javascript
// @ts-check
import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
)
```

---

## .gitignore

```
node_modules
dist
.env
.env.local
.turbo
coverage
*.tsbuildinfo
generated/
```

---

## .husky/pre-commit

```
npx lint-staged
```

---

## API: apps/api/package.json

```json
{
  "name": "@<project>/api",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "type": "module",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/src/main.js",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "prisma:generate": "prisma generate",
    "prisma:migrate:dev": "prisma migrate dev && prisma generate",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.3",
    "@nestjs/core": "^11.0.1",
    "@nestjs/jwt": "^11.0.2",
    "@nestjs/passport": "^11.0.5",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/platform-socket.io": "^11.1.14",
    "@nestjs/throttler": "^6.5.0",
    "@nestjs/websockets": "^11.1.14",
    "@prisma/adapter-pg": "^7.4.1",
    "@prisma/client": "^7.4.1",
    "@sentry/nestjs": "^9.0.0",
    "dotenv": "^17.3.1",
    "nanoid": "^3.3.8",
    "nestjs-zod": "^4.0.0",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "socket.io": "^4.8.3",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@swc/core": "^1.11.29",
    "@swc/jest": "^0.2.39",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^22.10.7",
    "@types/passport-google-oauth20": "^2.0.17",
    "@types/passport-jwt": "^4.0.1",
    "@types/supertest": "^6.0.2",
    "jest": "^30.0.0",
    "prisma": "^7.4.1",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0"
  },
  "prisma": {
    "schema": "prisma/schema.prisma"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": [
        "@swc/jest",
        {
          "jsc": {
            "parser": {
              "syntax": "typescript",
              "decorators": true
            },
            "transform": {
              "legacyDecorator": true,
              "decoratorMetadata": true
            }
          }
        }
      ]
    },
    "moduleNameMapper": {
      "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

---

## API: apps/api/tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "isolatedModules": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## API: apps/api/nest-cli.json

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "preserveWatchOutput": true
  }
}
```

---

## API: apps/api/eslint.config.mjs

```javascript
// @ts-check
import globals from 'globals'
import tseslint from 'typescript-eslint'
import rootConfig from '../../eslint.config.mjs'

export default tseslint.config(
  ...rootConfig,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
)
```

---

## API: apps/api/prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

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

---

## API: apps/api/prisma.config.ts

```typescript
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
```

---

## Web: apps/web/package.json

```json
{
  "name": "@<project>/web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --clearScreen false",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@hookform/resolvers": "^4.0.0",
    "@radix-ui/react-slot": "^1.2.0",
    "@sentry/react": "^9.0.0",
    "@tailwindcss/vite": "^4.1.18",
    "@tanstack/react-query": "^5.90.21",
    "@testing-library/user-event": "^14.6.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.564.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.55.0",
    "react-router": "^7.13.0",
    "socket.io-client": "^4.8.3",
    "tailwind-merge": "^3.0.0",
    "tailwindcss": "^4.1.18"
  },
  "devDependencies": {
    "@sentry/vite-plugin": "^3.0.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^24.10.1",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "jsdom": "^26.1.0",
    "vite": "^7.3.1",
    "vitest": "^3.2.1"
  }
}
```

---

## Web: apps/web/tsconfig.json

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

---

## Web: apps/web/tsconfig.app.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

---

## Web: apps/web/tsconfig.node.json

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

---

## Web: apps/web/vite.config.ts

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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

---

## Web: apps/web/eslint.config.js

```javascript
// @ts-check
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import rootConfig from '../../eslint.config.mjs'

export default tseslint.config(...rootConfig, {
  files: ['**/*.{ts,tsx}'],
  extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
})
```

---

## Web: apps/web/components.json (shadcn/ui)

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

## Web: apps/web/index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Fira+Code:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <title>App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## docker-compose.yml

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: <project>-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: <project>
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD', 'pg_isready', '-U', 'postgres']
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
      target: deps
    working_dir: /app
    command: >
      sh -c "npx -w @<project>/api prisma generate &&
             npx -w @<project>/api prisma migrate deploy &&
             npx -w @<project>/api nest start --watch --preserveWatchOutput"
    volumes:
      - ./apps/api/src:/app/apps/api/src
      - ./apps/api/prisma:/app/apps/api/prisma
      - ./apps/api/nest-cli.json:/app/apps/api/nest-cli.json
      - ./apps/api/tsconfig.json:/app/apps/api/tsconfig.json
      - ./apps/api/tsconfig.build.json:/app/apps/api/tsconfig.build.json
      - ./tsconfig.base.json:/app/tsconfig.base.json
    ports:
      - '${API_PORT:-3000}:${API_PORT:-3000}'
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/<project>?schema=public
      PORT: '${API_PORT:-3000}'
      NODE_ENV: development
    depends_on:
      db:
        condition: service_healthy

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
      target: deps
    working_dir: /app
    command: npx -w @<project>/web vite --host 0.0.0.0 --clearScreen false
    volumes:
      - ./apps/web/src:/app/apps/web/src
      - ./apps/web/index.html:/app/apps/web/index.html
      - ./apps/web/vite.config.ts:/app/apps/web/vite.config.ts
      - ./apps/web/tsconfig.json:/app/apps/web/tsconfig.json
      - ./apps/web/tsconfig.app.json:/app/apps/web/tsconfig.app.json
      - ./apps/web/tsconfig.node.json:/app/apps/web/tsconfig.node.json
      - ./tsconfig.base.json:/app/tsconfig.base.json
    ports:
      - '${WEB_PORT:-5173}:${WEB_PORT:-5173}'
    environment:
      VITE_API_URL: http://localhost:${API_PORT:-3000}

volumes:
  pgdata:
```

---

## API Dockerfile: apps/api/Dockerfile

```dockerfile
# ---- Stage 1: Install dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm ci --ignore-scripts

# ---- Stage 2: Generate Prisma client and build ----
FROM deps AS build
WORKDIR /app

COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/tsconfig.json apps/api/nest-cli.json ./apps/api/
RUN npx -w @<project>/api prisma generate

COPY apps/api/src ./apps/api/src

RUN npm run build -w @<project>/api

# ---- Stage 3: Production image ----
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm ci --omit=dev --ignore-scripts

COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/prisma.config.ts ./apps/api/
COPY --from=build /app/apps/api/dist ./apps/api/dist

EXPOSE 3000

CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && cd /app && node apps/api/dist/src/main.js"]
```

---

## Web Dockerfile: apps/web/Dockerfile

```dockerfile
# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

RUN npm ci --ignore-scripts

# ---- Stage 2: Build the Vite app ----
FROM deps AS build
WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY apps/web/ ./apps/web/

RUN npm run build -w @<project>/web

# ---- Stage 3: Serve with nginx ----
FROM nginx:alpine AS production

RUN rm /etc/nginx/conf.d/default.conf

COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

ENV PORT=80
EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
```

---

## Web nginx.conf: apps/web/nginx.conf

```nginx
server {
    listen ${PORT};
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_vary on;
    gzip_min_length 256;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## scripts/dev.mjs

```javascript
import { execSync, spawn } from 'node:child_process'
import detect from 'detect-port'

const apiPort = await detect(3000)
const webPort = await detect(5173)

console.log(`Starting API on port ${apiPort}, Web on port ${webPort}`)

execSync('docker compose up -d --wait db', { stdio: 'inherit' })
execSync('prisma generate --schema apps/api/prisma/schema.prisma', {
  stdio: 'inherit',
})

const api = `PORT=${apiPort} nest start -w -c apps/api/nest-cli.json -p apps/api/tsconfig.json --preserveWatchOutput`
const web = `VITE_API_URL=http://localhost:${apiPort} vite apps/web --clearScreen false --port ${webPort}`

spawn('concurrently', ['-n', 'api,web', '-c', 'blue,magenta', api, web], {
  stdio: 'inherit',
}).on('exit', (code) => process.exit(code ?? 0))
```

---

## scripts/validate.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "=== Format Check ==="
npm run format:check

echo "=== Lint ==="
npm run lint

echo "=== Generate Prisma Client ==="
npm run db:generate

echo "=== API Tests ==="
npm run test:api

echo "=== Web Tests ==="
npm run test:web

echo "=== Build API ==="
npm run build:api

echo "=== Build Web ==="
npm run build:web

echo "All checks passed."
```

Make this file executable: `chmod +x scripts/validate.sh`

---

## .env.example

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

Copy `.env.example` to `.env` and fill in the `DATABASE_URL` with the project name. Create symlink: `ln -s ../../.env apps/api/.env`
