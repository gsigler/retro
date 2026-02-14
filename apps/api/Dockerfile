# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm ci

# ---- Stage 2: Generate Prisma client and build ----
FROM deps AS build
WORKDIR /app

COPY apps/api/prisma ./apps/api/prisma
RUN npx -w @retro/api prisma generate

COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json ./apps/api/

RUN npm run build -w @retro/api

# ---- Stage 3: Production image ----
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm ci --omit=dev

COPY apps/api/prisma ./apps/api/prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

COPY --from=build /app/apps/api/dist ./apps/api/dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && node apps/api/dist/main.js"]
