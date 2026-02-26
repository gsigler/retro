import { test, expect } from '@playwright/test'

test.describe('dashboard', () => {
  test('loads and shows user email in nav bar', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('e2e@test.local')).toBeVisible()
  })

  test('prompts new user to create or join a team', async ({ page }) => {
    await page.goto('/dashboard')

    // The team dialog should appear automatically when user has no teams
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText(/No teams found/i)).toBeVisible()
  })

  test('can create a team via the dialog', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for team dialog to appear (auto-opens for users with no teams)
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // Click create team button
    await dialog.getByText('+ create team').click()

    // Fill in the create team dialog
    const createDialog = page.getByRole('dialog', { name: /create team/i })
    await expect(createDialog).toBeVisible()
    await createDialog.locator('#team-name').fill('E2E Test Team')
    await createDialog
      .locator('#team-description')
      .fill('Created by Playwright')
    await createDialog.getByRole('button', { name: /create/i }).click()

    // Team should now appear in the nav bar
    await expect(page.getByText('E2E Test Team')).toBeVisible({
      timeout: 10_000,
    })
  })

  test('can create a retro and navigate to the board', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for dashboard to fully load - look for the Retros section
    await expect(page.getByText('Retros', { exact: true })).toBeVisible({
      timeout: 10_000,
    })

    // Click new retro button
    await page.getByText('+ new retro').click()

    // Fill in the retro form dialog
    const dialog = page.getByRole('dialog', { name: /new retro/i })
    await expect(dialog).toBeVisible()
    await dialog.locator('#retro-name').fill('E2E Sprint Retro')
    await dialog.locator('#retro-date').fill('2026-03-01')
    await dialog.getByRole('button', { name: /create/i }).click()

    // Creating a retro navigates to the board page
    await expect(page).toHaveURL(/\/retros\/.*\/board/, { timeout: 10_000 })
  })

  test('logout clears session and redirects to landing', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('e2e@test.local')).toBeVisible({
      timeout: 10_000,
    })

    await page.getByText('logout').click()
    await expect(page).toHaveURL('/login', { timeout: 10_000 })
  })
})
