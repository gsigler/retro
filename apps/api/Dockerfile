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
COPY apps/api/prisma.config.ts apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json ./apps/api/
RUN npx -w @retro/api prisma generate

COPY apps/api/src ./apps/api/src

RUN npm run build -w @retro/api

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

CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && node apps/api/dist/src/main.js"]
