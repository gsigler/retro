# ---- Stage 1: Install dependencies ----
FROM node:22-alpine AS deps
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

RUN npm run build -w @retro/web

# ---- Stage 3: Serve with nginx ----
FROM nginx:alpine AS production

RUN rm /etc/nginx/conf.d/default.conf

COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

ENV PORT=80
EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '$PORT $API_URL' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
