import { defineConfig, devices } from '@playwright/test'

const API_PORT = process.env.API_PORT ?? '3000'
const WEB_PORT = process.env.WEB_PORT ?? '5173'
const WEB_PREVIEW_PORT = process.env.WEB_PREVIEW_PORT ?? '4173'
const API_URL = `http://localhost:${API_PORT}`
const isCI = !!process.env.CI

// In CI, vite preview serves on 4173 by default; locally, vite dev on 5173.
const WEB_URL = isCI
  ? `http://localhost:${WEB_PREVIEW_PORT}`
  : `http://localhost:${WEB_PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? 'github' : 'list',
  timeout: 30_000,

  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth-guard\.spec\.ts/,
    },

    {
      name: 'unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /auth-guard\.spec\.ts/,
    },
  ],

  webServer: isCI
    ? [
        {
          // In CI: run the pre-built API (no compilation step, instant start)
          command: `node apps/api/dist/src/main.js`,
          url: API_URL,
          reuseExistingServer: false,
          timeout: 30_000,
          env: { E2E_TEST_MODE: 'true', PORT: API_PORT },
        },
        {
          // In CI: serve the pre-built web bundle via vite preview
          command: `npx -w @retro/web vite preview --port ${WEB_PREVIEW_PORT}`,
          url: WEB_URL,
          reuseExistingServer: false,
          timeout: 15_000,
        },
      ]
    : [
        {
          // Locally: use dev servers (hot reload)
          command: `E2E_TEST_MODE=true npm run dev:api`,
          url: API_URL,
          reuseExistingServer: true,
          timeout: 60_000,
          env: { E2E_TEST_MODE: 'true' },
        },
        {
          command: `VITE_API_URL=${API_URL}/api npm run dev:web`,
          url: WEB_URL,
          reuseExistingServer: true,
          timeout: 60_000,
        },
      ],
})
