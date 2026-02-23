# Retro

A real-time retrospective platform for agile teams. Run structured retros with your team, vote on cards, group feedback, and track action items — all with live collaboration powered by WebSockets.

## Features

- **Team management** — create teams, invite members via shareable links, manage roles
- **Retro templates** — Start/Stop/Continue, Went Well/Didn't/Actions, Mad/Sad/Glad, 4Ls
- **Phased retros** — icebreaker, retrospect, and group vote phases with card visibility controls
- **Real-time board** — cards, votes, and merges update instantly for all participants
- **Action items** — create, assign, and track items with status and due dates
- **Google OAuth** — sign in with Google, JWT session cookies

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite 7, TanStack Query, React Router 7, Tailwind CSS 4 |
| Backend | NestJS 11, Prisma 7, Passport (Google OAuth + JWT), Socket.io |
| Database | PostgreSQL 16 |
| Tooling | TypeScript 5.9, ESLint 9, Prettier, Husky, npm workspaces |

## Project Structure

```
retro/
├── apps/
│   ├── api/          # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/           # Google OAuth & JWT
│   │   │   ├── board/          # Real-time board & WebSocket gateway
│   │   │   ├── retros/         # Retrospective CRUD
│   │   │   ├── teams/          # Team management
│   │   │   ├── action-items/   # Action item tracking
│   │   │   └── dashboard/      # Dashboard aggregation
│   │   └── prisma/
│   │       └── schema.prisma
│   └── web/          # React/Vite frontend
│       └── src/
│           ├── pages/          # Route pages
│           ├── components/     # Terminal-themed UI components
│           ├── lib/            # API client
│           └── contexts/       # Theme & auth contexts
├── scripts/
├── docker-compose.yml
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 22+
- Docker & Docker Compose

### Setup

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env
```

Required values in `.env`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL |
| `APP_URL` | Frontend URL (for CORS) |
| `VITE_API_URL` | API URL (baked into the Vite build) |

### Database

```bash
# Start PostgreSQL
npm run docker:up

# Run migrations
npm run db:migrate:dev

# (Optional) Open Prisma Studio
npm run db:studio
```

### Development

```bash
# Start both API and web with auto-reload
npm run dev

# Or run separately
npm run dev:api    # NestJS (port 3000)
npm run dev:web    # Vite (port 5173)
```

### Testing

```bash
npm run test:api
npm run test:web
```

### Full Validation

```bash
bash scripts/validate.sh   # format, lint, tests, builds
```

### Build

```bash
npm run build:api
npm run build:web
```

## Docker

```bash
# Build and start all services (db, api, web)
npm run docker:build
npm run docker:up

# Tear down
npm run docker:down
```
