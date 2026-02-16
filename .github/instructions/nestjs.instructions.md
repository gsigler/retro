---
applyTo: 'apps/api/**/*.ts'
---

This is a NestJS 11 backend using Prisma ORM with PostgreSQL.
Use dependency injection. Controllers handle HTTP routing. Services contain business logic.
Always regenerate Prisma client after schema changes: `npm run db:generate`.
Test files use `.spec.ts` extension. Use `@nestjs/testing` TestingModule.
Jest is the test runner. E2e tests live in `test/` and use supertest.
