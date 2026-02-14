Scaffold a new NestJS API endpoint. Ask for the resource name if not provided as $ARGUMENTS.

Steps:
1. Generate module: `npx -w @retro/api nest g module $ARGUMENTS`
2. Generate controller: `npx -w @retro/api nest g controller $ARGUMENTS`
3. Generate service: `npx -w @retro/api nest g service $ARGUMENTS`
4. Verify the module is registered in `apps/api/src/app.module.ts`
5. Add meaningful unit tests for the controller and service
6. Run `npm run test:api` to verify tests pass