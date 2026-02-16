---
name: create-pr
description: Create a pull request. Runs the full CI validation suite locally before pushing, then opens a PR via GitHub CLI.
argument-hint: [base branch]
---

Create a pull request for the current branch. Run all CI checks locally first, then push and open the PR.

## Step 1: Pre-flight checks

1. Confirm the working tree is on a feature branch (not `main`). Abort if on `main`.
2. Check for uncommitted changes. If any exist, ask the user whether to commit them before continuing.
3. Determine the base branch. Use `$ARGUMENTS` if provided, otherwise default to `main`.

## Step 2: Run full CI validation locally

Run `bash scripts/validate.sh` from the repo root. This mirrors the CI pipeline:

- Format check (`npm run format:check`)
- Lint (`npm run lint`)
- Prisma client generation (`npm run db:generate`)
- API tests (`npm run test:api`)
- Web tests (`npm run test:web`)
- API build (`npm run build:api`)
- Web build (`npm run build:web`)

If any step fails, stop immediately. Diagnose the failure and fix it. Re-run validation until all checks pass. Do NOT push or create a PR until validation succeeds.

## Step 3: Push the branch

Push the current branch to `origin` with the `-u` flag to set upstream tracking.

## Step 4: Create the pull request

1. Analyze all commits on this branch vs the base branch using `git log` and `git diff` against the base.
2. Create the PR using `gh pr create` with:
   - A concise title (under 70 characters)
   - A body following this format (use a HEREDOC):

```
## Summary
<1-3 bullet points describing the changes>

## Test plan
<Bulleted checklist of how to verify the changes>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

3. Return the PR URL to the user.
