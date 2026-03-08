---
name: code-quality-review
description: >
  Perform a principal-engineer-level code quality review of a TypeScript monorepo.
  Inspect the codebase for standards violations, produce a findings report grouped by
  category, implement fixes, and run verification. Use when the user asks to "review
  code quality", "code review", "review standards", "check code quality", "audit code",
  "clean up the codebase", "refactor", "find code smells", "check for anti-patterns",
  "review consistency", "improve code quality", or any request involving reviewing or
  improving code standards, maintainability, and consistency. Also triggers on: "find
  dead code", "check for unused exports", "review error handling", "check TypeScript
  safety", "find duplicated code", "review React patterns", "review Prisma queries",
  "check testability", "review naming conventions".
---

# Code Quality Review

Role: principal engineer reviewing a production codebase for quality, maintainability, and consistency.

## Process

1. **Inspect** — scan the codebase for standards violations
2. **Report** — produce findings grouped by category
3. **Fix** — implement improvements directly in the code
4. **Verify** — run lint, typecheck, and tests for affected packages

## Operating Rules

- Think repo-wide, change code narrowly
- Prefer root-cause fixes over patches
- Match existing conventions unless they are clearly wrong
- Do not fabricate requirements
- Before editing, inspect relevant files thoroughly
- After editing, summarize exactly what changed and why
- Add or update tests when practical
- Run the smallest meaningful verification set for affected packages
- If ambiguous, make the most evidence-based choice and document the assumption
- Avoid formatting-only churn unless it aligns with existing repo standards

## Step 1: Inspect

Read [references/checklist.md](references/checklist.md) for grep patterns and red-flag indicators per review area.

Work through areas in priority order (highest impact first):

1. **Correctness** — TypeScript safety, error handling, async/await consistency
2. **Maintainability** — dead code, function complexity, code duplication, separation of concerns
3. **Consistency** — naming conventions, React patterns, Chakra UI usage, validation boundaries
4. **Testability** — missing tests, tightly coupled dependencies, poor testability patterns

For each area, use the grep patterns from the checklist to systematically scan. Focus on the highest-impact findings — not every minor issue needs reporting.

### Project-Specific Standards

Read the project's `CLAUDE.md` for repo-specific conventions and enforce them during inspection.
Common areas to check: response DTO patterns, UI component usage, styling conventions, ORM query patterns, and code formatting rules.

## Step 2: Report

Produce a concise findings summary grouped by category. For each finding:

```
### [CATEGORY] Finding title
- **Severity:** high / medium / low
- **Affected files:** path/to/file.ts:lineNumber
- **Issue:** What the violation is and why it matters
- **Recommendation:** Specific fix approach
```

Categories: `CORRECTNESS` / `MAINTAINABILITY` / `CONSISTENCY` / `TESTABILITY`

Prioritize findings by impact. Omit categories with no findings.

## Step 3: Fix

For confirmed issues:

- Implement minimal fixes that do not change behavior
- Extract reusable utilities when duplication is obvious
- Add or update tests when logic is touched
- Summarize each change: what file, what changed, why

Do NOT:

- Add features, refactor code, or make "improvements" beyond what was identified
- Add docstrings, comments, or type annotations to untouched code
- Add error handling for scenarios that cannot happen
- Create abstractions for one-time operations

## Step 4: Verify

Run verification for affected packages:

```bash
bash scripts/validate.sh
```

Or selectively:
- `npm run format:check`
- `npm run lint`
- `npm run test:api` and/or `npm run test:web`
- `npm run build:api` and/or `npm run build:web`

## Output Format

```
# Code Quality Review Results

## Findings Summary
[Grouped by category: correctness, maintainability, consistency, testability]

## Files Changed
[List of modified files]

## Improvements Made
[Per-file summary of what changed and why]

## Verification Results
[Lint, test, build output]

## Issues Intentionally Left Unchanged
[Issues not fixed and why — e.g., too risky, needs product input, out of scope]
```
