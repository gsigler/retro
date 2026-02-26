import { test, expect } from '@playwright/test'

test.describe('landing page', () => {
  test('shows hero content and navigation', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: /actually enjoy/i }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible()
  })

  test('navigates from landing to login page', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: /login/i }).click()
    await expect(page).toHaveURL(/\/login/)

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(
      page.getByRole('link', { name: /sign in with google/i }),
    ).toBeVisible()
  })

  test('login page links back to home', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('link', { name: /back to home/i }).click()
    await expect(page).toHaveURL('/')
  })
})
