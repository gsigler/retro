# Retro - Technical Stack

This document describes the technologies, libraries, and tools that make up the
Retro application.

## Overview

Retro is a monorepo containing a **NestJS** backend and a **React** frontend,
managed with **npm workspaces**. The application provides real-time
retrospective boards backed by **PostgreSQL** and served over **WebSockets**.

```
retro/
  apps/
    api/    — NestJS backend  (@retro/api)
    web/    — React/Vite frontend  (@retro/web)
  scripts/  — validation & dev helpers
  docs/     — documentation
```

---

## Language & Runtime

| Tool | Version | Notes |
| ---------- | ------- | ----- |
| TypeScript | ~5.9 | Strict mode, ES2022+ target, ESM throughout |
| Node.js | 22 | Used in CI, Docker, and local development |

TypeScript is configured via a shared `tsconfig.base.json` at the root that
each app extends.

---

## Backend (`apps/api`)

### Framework

- **NestJS 11** on the **Express** adapter
- Module/Controller/Service architecture with dependency injection
- Guards for authentication and rate limiting
- DTOs with static `from()` factories for response shaping

### Database & ORM

- **PostgreSQL 16** (containerised via Docker)
- **Prisma 7** ORM with the `@prisma/adapter-pg` driver adapter
- ESM-only generated client (`generated/prisma/`)
- Migration-based schema management (`prisma migrate dev`)

#### Data Model

Core entities: **User**, **Team**, **TeamMember**, **Retro**, **Column**,
**Card**, **ActionItem**. IDs are CUIDs; cascade deletes maintain referential
integrity.

### Authentication

- **Passport** with two strategies:
  - **JWT** (`@nestjs/jwt`, `passport-jwt`) for stateless API auth
  - **Google OAuth 2.0** (`passport-google-oauth20`) for sign-in
- JWT secret and Google credentials loaded via `@nestjs/config`

### Real-Time

- **Socket.IO 4.8** via `@nestjs/websockets` and `@nestjs/platform-socket.io`
- Used for live retro board updates

### Validation & Security

- **class-validator** + **class-transformer** for request DTO validation
- **@nestjs/throttler** for API rate limiting

### Utilities

- **RxJS 7** (NestJS internals and reactive patterns)
- **nanoid 3** for short ID generation
- **dotenv** for environment variable loading

### Testing

- **Jest 30** as the test runner
- **@swc/jest** for fast TypeScript transpilation
- **Supertest 7** for HTTP-level integration tests
- **@nestjs/testing** for module-scoped unit tests

---

## Frontend (`apps/web`)

### Framework & Build

- **React 19** with functional components and hooks
- **Vite 7** for development server and production bundling
- **@vitejs/plugin-react** for JSX support

### Routing

- **React Router 7** (`@reactrouter/dom`)

### State Management

- **TanStack React Query 5** for server state (fetching, caching, invalidation)
- **React Context** for client-side state (auth, theme)

### Styling

- **Tailwind CSS 4** integrated via `@tailwindcss/vite`
- Utility-first approach with a terminal-inspired theme

### UI Libraries

- **Lucide React** for SVG icons
- **@dnd-kit** (core, sortable, utilities) for drag-and-drop interactions

### Real-Time

- **Socket.IO Client 4.8** for WebSocket communication with the API

### Testing

- **Vitest 3.2** (Vite-native test runner)
- **React Testing Library** (`@testing-library/react`, `user-event`, `jest-dom`)
- **jsdom 26** as the DOM environment

---

## Infrastructure

### Containerisation

- **Docker** multi-stage builds for both API and web
- **Docker Compose** for local orchestration (API + PostgreSQL + web)
- Images based on **Node.js 22-alpine** (API) and **Nginx alpine** (web)

### Web Server (Production)

- **Nginx** serves the built React app with:
  - SPA fallback (`try_files $uri /index.html`)
  - Gzip compression
  - Long-lived asset caching

### CI/CD

- **GitHub Actions** (`.github/workflows/ci.yml`)
- Jobs: **Lint**, **Test API**, **Test Web**, **Build**
- Triggered on pushes to `main` and on pull requests

### Environment

A single `.env` at the monorepo root (symlinked into `apps/api/`) holds:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` / `JWT_EXPIRATION`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL`
- `PORT` (API, default 3000)
- `VITE_API_URL` (baked into the frontend build)

---

## Code Quality

| Tool | Purpose |
| ------------- | ------- |
| ESLint 9 | Linting (flat config with typescript-eslint) |
| Prettier 3.4 | Formatting (`singleQuote`, `trailingComma: "all"`, `semi: false`) |
| Husky 9 | Git hooks (pre-commit) |
| lint-staged 16 | Run linters on staged files only |

A unified validation script (`scripts/validate.sh`) runs formatting checks,
linting, tests, and builds in sequence.

---

## Dependency Summary

| Category | Technology |
| ------------------- | ------------------------------------------- |
| Language | TypeScript 5.9, ESM |
| API Framework | NestJS 11 (Express) |
| Frontend Framework | React 19 (Vite 7) |
| Database | PostgreSQL 16 (Prisma 7) |
| Auth | JWT + Google OAuth 2.0 (Passport) |
| Real-Time | Socket.IO 4.8 |
| Server State | TanStack React Query 5 |
| Styling | Tailwind CSS 4 |
| Drag & Drop | @dnd-kit |
| Icons | Lucide React |
| Backend Testing | Jest 30, SWC, Supertest |
| Frontend Testing | Vitest 3.2, React Testing Library |
| Code Quality | ESLint, Prettier, Husky, lint-staged |
| Containerisation | Docker, Docker Compose, Nginx |
| CI/CD | GitHub Actions |
| Package Management | npm workspaces |
| Runtime | Node.js 22 |
