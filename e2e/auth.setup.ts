import { test as setup } from '@playwright/test'

const API_URL =
  process.env.VITE_API_URL ??
  `http://localhost:${process.env.API_PORT ?? '3000'}/api`
const authFile = 'e2e/.auth/user.json'
const secondAuthFile = 'e2e/.auth/user2.json'

setup('authenticate via test-login endpoint', async ({ request }) => {
  const response = await request.post(`${API_URL}/auth/test-login`, {
    data: {
      email: 'e2e@test.local',
      name: 'E2E Test User',
    },
  })

  if (!response.ok()) {
    throw new Error(
      `Test login failed (${response.status()}): ${await response.text()}. ` +
        'Is the API running with E2E_TEST_MODE=true?',
    )
  }

  await request.storageState({ path: authFile })
})

setup('authenticate second user', async ({ request }) => {
  const response = await request.post(`${API_URL}/auth/test-login`, {
    data: {
      email: 'e2e-user2@test.local',
      name: 'E2E Second User',
    },
  })

  if (!response.ok()) {
    throw new Error(
      `Test login for second user failed (${response.status()}): ${await response.text()}`,
    )
  }

  await request.storageState({ path: secondAuthFile })
})
