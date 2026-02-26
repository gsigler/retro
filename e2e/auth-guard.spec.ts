import { test, expect } from '@playwright/test'

test.describe('auth guards', () => {
  test('redirects /dashboard to /login when unauthenticated', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects /retros/:id/board to /login when unauthenticated', async ({
    page,
  }) => {
    await page.goto('/retros/nonexistent/board')
    await expect(page).toHaveURL(/\/login/)
  })
})
