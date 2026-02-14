# Web App — React + Vite

## Stack

- React 19 with TypeScript
- Vite 7 for dev server and bundling
- Vitest + React Testing Library for tests

## Key Commands

- `npm run test:web` — run unit tests
- `npm run build:web` — type-check and build

## Patterns

- Functional components only; use hooks for state
- Test files use `.test.tsx` extension alongside source files
- Use `@testing-library/react` with `render` and `screen` for component tests
- Test runner is Vitest (not Jest)
