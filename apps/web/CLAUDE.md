# Web App — React + Vite

## Stack

- React 19 with TypeScript
- Vite 7 for dev server and bundling
- TanStack React Query for server state management
- Vitest + React Testing Library for tests

## Key Commands

- `npm run test:web` — run unit tests
- `npm run build:web` — type-check and build

## Patterns

- Functional components only; use hooks for state
- Test files use `.test.tsx` extension alongside source files
- Use `@testing-library/react` with `render` and `screen` for component tests
- Test runner is Vitest (not Jest)

## Data Fetching

- Use TanStack React Query (`useQuery`) for all API data fetching — never raw `useEffect` + `useState` for server state
- API functions live in `lib/api.ts`; each returns a typed `Promise<T>`
- Use `queryClient.invalidateQueries()` after mutations to keep data fresh across sections
- Wrap test renders in `<QueryClientProvider>` with `retry: false` for deterministic tests
