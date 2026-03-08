---
name: dependency-upgrader
description: >
  Audit and remediate dependency vulnerabilities in a TypeScript monorepo (React frontend,
  NestJS backend, Prisma ORM, npm workspaces). Identify vulnerable packages, classify by
  severity and exploitability, and apply the safest upgrades while preserving stability.
  Use when the user asks to "upgrade dependencies", "update packages", "fix vulnerabilities",
  "audit dependencies", "npm audit", "update npm packages", "check for outdated packages",
  "upgrade node modules", "fix security vulnerabilities in dependencies", "dependency review",
  "update to latest versions", or any request involving auditing, upgrading, or remediating
  npm/node dependency vulnerabilities. Also triggers on: "outdated packages", "vulnerable
  dependencies", "dependency security", "npm outdated", "upgrade prisma", "upgrade nestjs",
  "upgrade react", "upgrade chakra", "bump versions", "reduce vulnerabilities".
---

# Dependency Upgrader

Role: senior Node.js platform engineer reducing dependency vulnerabilities in a production monorepo.

## Process

1. **Audit** — identify vulnerabilities across the monorepo
2. **Classify** — categorize by severity, scope, and exploitability
3. **Remediate** — apply fixes using the safest approach
4. **Verify** — confirm builds, tests, and runtime still work

## Operating Rules

- Think repo-wide, change code narrowly
- Prefer root-cause fixes over patches
- Match existing conventions unless they are clearly wrong
- Before editing, inspect relevant files thoroughly
- After editing, summarize exactly what changed and why
- Add or update tests when practical
- Run the smallest meaningful verification set for affected packages
- If ambiguous, make the most evidence-based choice and document the assumption
- Always run `npm install` from the monorepo root

## Step 1: Audit

Read [references/checklist.md](references/checklist.md) for commands and ecosystem-specific patterns.

Run `npm audit` and `npm outdated` to identify vulnerabilities and stale packages. Parse results to build a complete picture of the dependency health.

## Step 2: Classify

For each finding, determine:

| Factor | Options |
|--------|---------|
| Dependency type | direct / transitive |
| Scope | runtime / dev-only |
| Severity | critical / high / moderate / low |
| Exploitability | reachable in this project? |

Priority order:
1. Critical/high severity, runtime, direct → fix immediately
2. Critical/high severity, runtime, transitive → fix or override
3. Moderate severity, runtime → fix if straightforward
4. Dev-only vulnerabilities → fix when convenient, document if deferred

## Step 3: Remediate

Apply fixes in order of safety (least disruptive first):

1. **Patch/minor upgrades** — `npm update` or install specific safe version
2. **Dependency overrides** — `overrides` field in root `package.json` for transitive issues
3. **Replace unsafe packages** — swap for maintained alternatives, remove if unused
4. **Major version upgrades** — only when required; update code for breaking changes

Key constraints:
- Keep versions consistent across workspaces
- Avoid unnecessary dependency churn
- Remove unused vulnerable dependencies when feasible
- Hoist shared dependencies to root when versions align

### Ecosystem-Specific Rules

- **Prisma**: `@prisma/client` and `prisma` versions must match; run `npx prisma generate` after upgrade
- **NestJS**: all `@nestjs/*` packages should be on the same major version
- **React**: `react` and `react-dom` versions must match; check Chakra UI peer deps
- **TypeScript**: run `npx tsc --noEmit` after upgrade to catch new errors

## Step 4: Verify

```bash
bash scripts/validate.sh
npm audit
```

Confirm zero regressions in formatting, lint, types, tests, and builds. Re-audit to confirm vulnerability count is reduced.

## Unfixable Vulnerabilities

If a vulnerability cannot be safely fixed, document:

```
### [SEVERITY] package-name@version
- **Type:** runtime / dev-only
- **Direct / transitive:** via parent-package
- **Reason unfixed:** [breaking changes, no safe version, upstream not patched]
- **Risk assessment:** [is the vulnerable code path reachable?]
- **Recommended follow-up:** [monitor for upstream fix, plan major upgrade, etc.]
```

## Output Format

```
# Dependency Upgrade Results

## Vulnerability Summary
[Count by severity, runtime vs dev, direct vs transitive]

## Upgrade Strategy
[Approach taken and rationale]

## Packages Updated
[Table: package, old version, new version, workspace, reason]

## Code Changes Required
[Files modified to accommodate breaking changes]

## Verification Results
[Build, lint, test, audit output]

## Remaining Vulnerabilities
[Documented with rationale per the template above]
```
