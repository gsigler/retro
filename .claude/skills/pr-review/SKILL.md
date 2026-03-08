---
name: pr-review
description: >
  Review changed code for reuse, quality, and efficiency, then fix any issues found.
  Run full validation, create a PR, and assign reviewers. Use before or when creating
  a pull request. Triggers on: "create pr", "open pr", "submit pr", "review and create pr",
  "pr review", "open pull request", "create pull request", "submit pull request",
  "review my changes", "review changes and create pr".
---

# PR Review & Create

Role: senior engineer performing a thorough self-review of all proposed changes before opening a pull request.

## Process

1. **Diff** — identify all changes relative to the base branch
2. **Review** — perform a full code review on the diff
3. **Validate** — run the validation script and fix any failures
4. **Create PR** — open the pull request with reviewers assigned

## Step 1: Diff

Determine the base branch and collect the full diff:

```bash
git log --oneline main..HEAD
git diff main...HEAD
```

If `main` is not the correct base, determine the appropriate base branch from context.

List all changed files and understand the scope of the changes before reviewing.

## Step 2: Review

Review every changed file in the diff. For each file, check:

### Correctness
- Logic errors, off-by-one bugs, missing edge cases
- Proper error handling — no swallowed errors, no missing catch blocks
- Async/await correctness — no floating promises, proper error propagation
- TypeScript safety — no unsafe casts, no `any` types without justification

### Code Quality
- No dead code, unused imports, or commented-out code
- Functions are focused and not overly complex
- No code duplication that should be extracted
- Naming is clear and consistent with existing conventions

### Project Standards
- Read the project's `CLAUDE.md` for repo-specific conventions and enforce them during review
- Check: response DTO patterns, UI component usage, styling conventions, ORM query patterns, formatting rules

### Security
- No secrets, API keys, or credentials in code
- Input validation at system boundaries
- No injection vulnerabilities (SQL, XSS, command injection)

### Tests
- New logic has corresponding tests
- Tests are meaningful, not just checking that code runs
- Edge cases are covered

When issues are found, fix them directly in the code. Summarize each fix.

## Step 3: Validate

Run the full validation script:

```bash
bash scripts/validate.sh
```

This runs formatting checks, linting, Prisma generation, tests, and builds.

If any step fails:
1. Read the error output carefully
2. Fix the root cause
3. Re-run validation until it passes cleanly

Do NOT skip or ignore failures. Every check must pass before creating the PR.

## Step 4: Create PR

Commit any fixes made during review and validation with clear commit messages.

Create the pull request:

```bash
gh pr create --title "<concise title>" --body "$(cat <<'EOF'
## Summary
<bullet points describing what this PR does>

## Changes
<list of key changes, grouped logically>

## Test plan
- [ ] All tests pass (`bash scripts/validate.sh`)
- [ ] <additional relevant test steps>

https://claude.ai/code
EOF
)" --reviewer gsigler,copilot
```

### PR Guidelines
- Title should be concise (under 70 characters) and describe the change
- Summary should explain **what** and **why**, not just **how**
- Group related changes together in the description
- Always assign `@gsigler` and `@copilot` as reviewers

## Operating Rules

- Review ALL changed files, not just a sample
- Fix issues directly — do not just report them
- Do not make unrelated changes or "improvements" outside the diff scope
- Run full validation — partial checks are not sufficient
- If validation fails, fix and re-run until clean
- Commit review fixes separately from the original changes when possible

## Output Format

```
# PR Review Results

## Changes Reviewed
[List of files reviewed with brief description]

## Issues Found & Fixed
[Per-issue: what was wrong, what was fixed, which file]

## Issues Found & Left (if any)
[Issues not fixed and why — e.g., out of scope, needs discussion]

## Validation Results
[Output summary from scripts/validate.sh]

## Pull Request
[Link to created PR]
```
