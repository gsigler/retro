# API App — NestJS

## Stack

- NestJS 11 with Express
- Prisma ORM with PostgreSQL
- Jest for unit and e2e tests

## Key Commands

- `npm run test:api` — run unit tests
- `npm run test:e2e -w @retro/api` — run e2e tests
- `npm run db:generate` — regenerate Prisma client after schema changes
- `npm run db:migrate:dev` — create and apply migrations
- `npm run db:studio` — open Prisma Studio

## Patterns

- Controllers handle HTTP routing; Services contain business logic
- Always regenerate Prisma client after modifying `prisma/schema.prisma`
- Test files use `.spec.ts` extension alongside source files
- E2e tests live in `test/` directory
- Use `@nestjs/testing` `Test.createTestingModule` for unit tests
- Use `supertest` for e2e HTTP assertions
