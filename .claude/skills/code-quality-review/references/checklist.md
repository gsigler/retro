# Code Quality Review Checklist

Grep patterns and red-flag indicators organized by review area.

## TypeScript Safety

```bash
# Explicit `any` usage
rg '\bany\b' --type ts -g '!*.d.ts' -g '!node_modules'
# ts-ignore / ts-expect-error
rg '@ts-ignore|@ts-expect-error' --type ts
# Unsafe type assertions
rg '\bas\s+any\b|as\s+unknown\b' --type ts
# Non-null assertions (!)
rg '\w+!\.' --type ts
```

Red flags: `any` in function signatures, `as any` to silence errors, `@ts-ignore` without explanation.

## Dead Code & Unused Exports

```bash
# Unused imports (ESLint should catch, but verify)
rg '^import .* from' --type ts
# Commented-out code blocks
rg '^\s*//' --type ts -C 2
# TODO/FIXME/HACK markers
rg 'TODO|FIXME|HACK|XXX' --type ts
```

Red flags: exported functions/types with zero imports elsewhere, commented-out code blocks, unused variables.

## Function Complexity

```bash
# Long functions (look for function bodies exceeding ~50 lines)
rg 'function |=> \{|async \(' --type ts
# Deeply nested callbacks/conditionals
rg '^\s{12,}' --type ts
```

Red flags: functions over 50 lines, nesting deeper than 3 levels, functions doing multiple unrelated things.

## Code Duplication

Look for repeated patterns across files:

```bash
# Similar function names across files
rg 'export (async )?function' --type ts
# Repeated error handling patterns
rg 'catch|throw new' --type ts
# Repeated validation logic
rg 'if \(!|if \(.*===.*null|if \(.*===.*undefined' --type ts
```

Red flags: copy-pasted logic across services, repeated transform/map patterns, duplicated validation.

## Error Handling

```bash
# Empty catch blocks
rg 'catch\s*\([^)]*\)\s*\{[\s]*\}' --type ts
# Swallowed errors (catch with only console.log)
rg 'catch.*\{' --type ts -A 3
# Missing error handling on async calls
rg 'await ' --type ts
# Unhandled promise patterns
rg '\.then\(' --type ts
```

Red flags: empty catch blocks, `catch (e) { console.log(e) }`, missing `.catch()` on promises, inconsistent error propagation.

## Async/Await Consistency

```bash
# Mixed promise patterns
rg '\.then\(|\.catch\(' --type ts
# Unnecessary async (no await inside)
rg 'async ' --type ts
# Sequential awaits that could be parallel
rg 'await.*\n.*await' --type ts
```

Red flags: mixing `.then()` and `await`, `async` functions with no `await`, sequential `await` calls that could use `Promise.all`.

## Separation of Concerns

```bash
# Business logic in controllers
rg 'class.*Controller' --type ts -A 30
# Database queries outside services
rg 'prisma\.' --type ts
# Direct HTTP/fetch calls in components
rg 'fetch\(|axios\.' --type tsx
```

Red flags: controllers with business logic, Prisma calls in controllers, API calls directly in React components without hooks/services.

## Naming Conventions

```bash
# Inconsistent file naming
find . -name '*.ts' -not -path '*/node_modules/*' | head -50
# Boolean variables without is/has/should prefix
rg 'const ((?!is|has|should|can|will)[a-z]+):\s*boolean' --type ts
```

Red flags: mixed naming styles (camelCase vs snake_case), inconsistent file naming patterns, unclear variable names.

## React Anti-Patterns

```bash
# Inline function definitions in JSX props
rg 'onClick=\{.*=>' --type tsx
# Missing key props in lists
rg '\.map\(' --type tsx -A 5
# Direct DOM manipulation
rg 'document\.|getElementById|querySelector' --type tsx
# useEffect without dependency array
rg 'useEffect\(' --type tsx -A 3
# Large components (file line count)
wc -l apps/web/src/**/*.tsx 2>/dev/null | sort -rn | head -20
```

Red flags: inline arrow functions as props, missing `key` in `.map()`, `useEffect` with missing/wrong deps, components over 200 lines.

## UI Component Consistency

```bash
# Hand-styled buttons or links
rg '<a |<Link ' --type tsx -g '!*.test.*'
# Inline style objects
rg 'style=\{\{' --type tsx
# Direct color values instead of theme tokens
rg "color=['\"]#|background=['\"]#|bg=['\"]#" --type tsx
```

Red flags: inconsistent component usage, inline colors instead of theme tokens, inconsistent spacing/sizing. Check CLAUDE.md for project-specific UI conventions.

## Loading/Empty/Error States

```bash
# Components rendering data without loading check
rg 'isLoading|loading|isError|error' --type tsx
# Missing Suspense/ErrorBoundary
rg 'Suspense|ErrorBoundary' --type tsx
```

Red flags: data rendered without loading state, missing error UI, no empty-state handling for lists.

## Validation Boundaries

```bash
# DTOs and validation decorators
rg '@IsString|@IsNumber|@IsIn|@IsOptional|@ValidateNested' --type ts
# Controllers returning raw Prisma objects (violates CLAUDE.md)
rg 'return.*prisma\.' --type ts
# Missing ValidationPipe
rg 'ValidationPipe' --type ts
```

Red flags: controllers returning raw Prisma objects, missing DTO validation decorators, no `ValidationPipe` setup.

## Prisma Query Patterns

```bash
# N+1 queries (loops with await inside)
rg 'for.*\{' --type ts -A 5
# Missing select/include (fetching all fields)
rg 'prisma\.\w+\.(findMany|findFirst|findUnique)\(' --type ts -A 5
# Raw queries
rg '\$queryRaw|\$executeRaw' --type ts
```

Red flags: queries inside loops (N+1), `findMany` without `select` or `where`, missing pagination on list endpoints.

## Magic Values

```bash
# Hardcoded numbers
rg '=\s*\d{2,}' --type ts -g '!*.spec.*' -g '!*.test.*'
# Hardcoded strings that look like config
rg "= ['\"]https?://|= ['\"]api/|= ['\"]/" --type ts -g '!*.spec.*'
```

Red flags: hardcoded URLs, timeouts, limits, or status codes without named constants.

## Testability

```bash
# Test file coverage
find . -name '*.spec.ts' -o -name '*.test.ts' -o -name '*.test.tsx' | head -30
# Tightly coupled dependencies (hard to mock)
rg 'new .*Service\(' --type ts -g '!*.spec.*'
# Direct module-level side effects
rg '^(fetch|axios|console)' --type ts
```

Red flags: services without corresponding test files, tightly coupled dependencies, untestable static methods.
