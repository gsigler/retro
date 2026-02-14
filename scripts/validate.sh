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
