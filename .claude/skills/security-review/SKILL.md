---
name: security-review
description: >
  Perform a practical application security review of a TypeScript monorepo codebase
  (React frontend, NestJS/Node.js backend, Prisma ORM, PostgreSQL). Inspect source code
  for vulnerabilities, produce a findings report, and implement fixes. Use when the user
  asks to "security review", "audit security", "find vulnerabilities", "check for security
  issues", "pentest the codebase", "harden the app", "OWASP review", or any request
  involving reviewing or fixing application security concerns in a web application codebase.
  Also triggers on: "check for injection", "find XSS", "review auth", "check access control",
  "look for secrets", "check for data leaks", "review input validation".
---

# Security Review

Role: senior application security engineer reviewing a production codebase.

## Process

1. **Inspect** — scan the codebase for vulnerabilities
2. **Report** — produce a findings summary
3. **Fix** — implement remediations for confirmed issues
4. **Verify** — run lint, typecheck, and tests for affected packages

## Operating Rules

- Think repo-wide, change code narrowly
- Prefer root-cause fixes over patches
- Match existing conventions unless they are clearly wrong
- Before editing, inspect relevant files thoroughly
- After editing, summarize exactly what changed and why
- Add or update tests when practical
- Run the smallest meaningful verification set for affected packages
- If ambiguous, make the most evidence-based choice and document the assumption

## Step 1: Inspect

Read [references/checklist.md](references/checklist.md) for grep patterns and red-flag indicators per security area.

Work through areas in this order (highest impact first):

1. **Auth & access control** — guards, ownership checks, IDOR
2. **Input validation** — DTOs, ValidationPipe, raw params
3. **Injection & unsafe queries** — `$queryRawUnsafe`, string concat in queries
4. **Secrets & data leaks** — hardcoded secrets, raw Prisma objects in responses, logging
5. **XSS** — `dangerouslySetInnerHTML`, unvalidated `href`
6. **CSRF & CORS** — cookie config, CORS origin policy
7. **External requests** — SSRF via user-controlled URLs
8. **Token/password handling** — weak generation, plaintext storage
9. **Rate limiting** — missing throttling on public/auth endpoints
10. **File handling** — uploads without type/size restrictions
11. **Dangerous APIs** — `eval`, `child_process.exec` with user input
12. **Open redirects** — user-controlled redirect targets

## Step 2: Report

Produce a concise findings summary. For each finding:

```
### [SEVERITY] Finding title
- **Affected files:** path/to/file.ts:lineNumber
- **Issue:** What the vulnerability is and why it's exploitable
- **Remediation:** Specific fix recommendation
```

Severity levels: `CRITICAL` / `HIGH` / `MEDIUM` / `LOW`

Group findings by severity. If no issues are found for an area, omit it.

## Step 3: Fix

For confirmed issues:
- Implement minimal fixes consistent with existing architecture
- Preserve current behavior for legitimate users
- Add tests where appropriate
- Summarize each change: what file, what changed, why

## Step 4: Verify

Run verification for affected packages:
- `npm run format:check` (formatting)
- `npm run lint` (linting)
- `npm run test:api` and/or `npm run test:web` (tests)
- `npm run build:api` and/or `npm run build:web` (typecheck + build)

Or use the project's full validation script if available (e.g., `bash scripts/validate.sh`).

## Output Format

```
# Security Review Results

## Findings Summary
[Grouped by severity]

## Files Changed
[List of modified files]

## Changes Implemented
[Per-file summary of what changed and why]

## Verification Results
[Lint, test, build output]

## Remaining Risks / Follow-up
[Issues not fixed, recommendations for future work]
```
