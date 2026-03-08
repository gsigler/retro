# Dependency Upgrade Checklist

Commands and patterns for auditing and upgrading dependencies in an npm workspace monorepo.

## Audit Commands

```bash
# Full vulnerability audit
npm audit

# Audit with JSON output for parsing
npm audit --json

# Check for outdated packages across workspaces
npm outdated

# List all installed packages with versions
npm ls --all --depth=0

# List a specific package across workspaces
npm ls <package-name> --all
```

## Classifying Vulnerabilities

For each vulnerability, determine:

1. **Direct vs transitive** — Is it in `dependencies`/`devDependencies` or pulled in by another package?
2. **Runtime vs dev-only** — Does it ship to production or only used during build/test?
3. **Severity** — critical / high / moderate / low
4. **Exploitability** — Is the vulnerable code path actually reachable in this project?

Priority order:
- Critical/high runtime direct dependencies → fix immediately
- Critical/high runtime transitive → fix or override
- Moderate runtime → fix if straightforward
- Dev-only vulnerabilities → fix when convenient, document if deferred

## Remediation Strategies (safest first)

### 1. Patch/Minor Upgrade

```bash
# Upgrade a specific package to latest compatible version
npm update <package-name>

# Install a specific version
npm install <package-name>@<version>

# Upgrade within a specific workspace
npm install <package-name>@<version> -w <workspace-name>
```

### 2. Dependency Overrides

In root `package.json`, force a transitive dependency to a safe version:

```json
{
  "overrides": {
    "vulnerable-package": ">=2.0.1"
  }
}
```

For scoped overrides (only override when pulled by a specific parent):

```json
{
  "overrides": {
    "parent-package": {
      "vulnerable-package": ">=2.0.1"
    }
  }
}
```

### 3. Replace Unsafe Packages

```bash
# Check if a package is actually used in code
rg "from ['\"]<package-name>" --type ts --type tsx
rg "require\(['\"]<package-name>" --type ts

# Check import count
rg "import.*from ['\"]<package-name>" --type ts -c
```

### 4. Major Version Upgrades

Before a major upgrade, check:

```bash
# Read changelog/migration guide
npm info <package-name> homepage

# Check what version ranges are specified
rg '"<package-name>"' package.json apps/*/package.json

# Check peer dependency requirements
npm info <package-name>@<version> peerDependencies
```

## Workspace Consistency

```bash
# Find packages installed at different versions across workspaces
npm ls --all | grep -E "^[├└]" | sort | uniq -c | sort -rn

# Check for duplicate entries in package-lock.json
rg '"<package-name>"' package-lock.json | head -20
```

Prefer hoisting shared dependencies to root `package.json` when versions align.

## Known Ecosystem Patterns

### Prisma
- `@prisma/client` and `prisma` (CLI) versions must match exactly
- Upgrade both together: `npm install prisma@latest @prisma/client@latest`
- After upgrade, run `npx prisma generate`

### NestJS
- All `@nestjs/*` packages should be on the same major version
- Check compatibility matrix before upgrading

### React / Chakra UI
- `react` and `react-dom` versions must match
- Chakra UI v3 requires React 18+
- Check `@chakra-ui/react` peer dependencies

### TypeScript
- After upgrading TypeScript, run `npx tsc --noEmit` in each app
- Check for new strict mode errors

## Verification Commands

```bash
# Full validation script
bash scripts/validate.sh

# Or individual checks
npm run format:check
npm run lint
npm run test:api
npm run test:web
npm run build:api
npm run build:web

# Re-audit after fixes
npm audit
```
