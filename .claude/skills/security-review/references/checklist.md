# Security Review Checklist

Grep patterns and red-flag indicators for each security area.

## 1. Authentication & Sessions

Look for: missing auth guards, hardcoded JWT secrets, tokens without expiration, session fixation.
Grep: `@Public`, `@NoAuth`, `UseGuards`, `JwtService`, `sign\(`, `verify\(`, `expiresIn`, `jwt.*secret`
Red flags: controllers without `@UseGuards(AuthGuard)`, JWT signed with static string, no `expiresIn`, tokens in localStorage.

## 2. Authorization / Access Control

Look for: missing ownership checks, IDOR, missing role checks, privilege escalation.
Grep: `@Param\('id'\)`, `findUnique`, `findFirst`, `params\.id`, `req\.user`, `where:.*id`
Red flags: `findUnique({ where: { id: params.id } })` without userId ownership check, no `@Roles()` on admin endpoints.

## 3. Input Validation

Look for: missing DTO validation, raw query params, missing `class-validator` decorators, no global ValidationPipe.
Grep: `@Body\(\)`, `@Query\(\)`, `@Param\(\)`, `ValidationPipe`, `IsString`, `IsInt`, `IsUUID`, `IsIn`
Red flags: `@Body() body: any`, no global pipe, DTOs without validators.

## 4. SQL Injection / Unsafe Prisma

Look for: `$queryRawUnsafe`, string interpolation in raw queries, string concatenation in queries.
Grep: `\$queryRaw`, `\$executeRaw`, `\$queryRawUnsafe`, `\$executeRawUnsafe`, `Prisma\.sql`
Note: Prisma tagged template `$queryRaw` auto-parameterizes — only `$queryRawUnsafe` and manual string building are dangerous.

## 5. XSS in React

Look for: `dangerouslySetInnerHTML`, user-controlled `href`/`src`, `javascript:` protocol.
Grep: `dangerouslySetInnerHTML`, `javascript:`, `href=\{`, `src=\{`, `__html`, `innerHTML`
Red flags: `dangerouslySetInnerHTML={{ __html: userContent }}` without sanitization, `<a href={userInput}>` without protocol validation.

## 6. CSRF & CORS

Look for: state-changing GET handlers, overly permissive CORS, cookies without SameSite.
Grep: `@Get\(`, `cors`, `sameSite`, `csrf`, `cookie`, `credentials.*true`, `origin.*\*`
Red flags: `@Get()` handlers that modify data, `cors({ origin: '*', credentials: true })`.

## 7. Secrets Exposure

Look for: hardcoded credentials, secrets in source, `.env` committed, secrets in logs/responses.
Grep: `password.*=.*['"]`, `secret.*=.*['"]`, `api.key.*=.*['"]`, `process\.env`
Red flags: secrets in default values like `process.env.KEY || 'hardcoded-fallback'`, `.env` in git history.

## 8. Data Leaks in Logs / Responses

Look for: logging request bodies, returning raw Prisma objects, stack traces in production errors.
Grep: `console\.log`, `console\.error`, `Logger\.(log|error|warn|debug)`, `password`, `select:`
Red flags: controllers returning raw Prisma objects without DTO mapping, error handlers returning `error.stack`.

## 9. SSRF / External Requests

Look for: user-controlled URLs in fetch/axios/http, no URL allowlist, no private IP range checks.
Grep: `fetch\(`, `axios`, `http\.get`, `http\.request`, `new URL\(`
Red flags: `fetch(userProvidedUrl)` without validation, webhook/callback URLs accepted without validation.

## 10. Token & Password Handling

Look for: weak token generation (Math.random), plaintext passwords, missing bcrypt/argon2.
Grep: `Math\.random`, `randomBytes`, `crypto\.random`, `bcrypt`, `argon2`, `nanoid`, `uuid`
Red flags: `Math.random().toString(36)` for tokens, passwords stored without hashing, MD5/SHA1 for passwords.

## 11. Rate Limiting / Abuse Protection

Look for: public endpoints without throttling, login without brute-force protection, no helmet.
Grep: `@Throttle`, `ThrottlerModule`, `ThrottlerGuard`, `rate.limit`, `express-rate-limit`, `helmet`
Red flags: no `ThrottlerModule` in `app.module.ts`, login endpoint without throttling.

## 12. File Uploads / Dangerous APIs / Open Redirects

Look for: unrestricted uploads, `eval()`, `child_process.exec` with user input, user-controlled redirects.
Grep: `FileInterceptor`, `multer`, `eval\(`, `new Function\(`, `child_process`, `exec\(`, `spawn\(`, `redirect`, `res\.redirect`, `window\.location`
Red flags: no `fileFilter` on multer, `path.join(uploadDir, req.file.originalname)` (path traversal), any `eval()` with external input, `res.redirect(req.query.returnUrl)` without domain validation.
