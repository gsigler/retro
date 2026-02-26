import { defineConfig, devices } from '@playwright/test'

const API_PORT = process.env.API_PORT ?? '3000'
const WEB_PORT = process.env.WEB_PORT ?? '5173'
const API_URL = `http://localhost:${API_PORT}`
const WEB_URL = `http://localhost:${WEB_PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
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

  webServer: [
    {
      command: `E2E_TEST_MODE=true npm run dev:api`,
      url: `${API_URL}/api`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: { E2E_TEST_MODE: 'true' },
    },
    {
      command: `VITE_API_URL=${API_URL}/api npm run dev:web`,
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
})
