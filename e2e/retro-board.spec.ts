import { test, expect } from '@playwright/test'

const API_URL = `http://localhost:${process.env.API_PORT ?? '3000'}/api`

test.describe('retro board lifecycle', () => {
  let retroId: string

  test.beforeAll(async ({ request }) => {
    // Create a team via API
    const teamRes = await request.post(`${API_URL}/teams`, {
      data: { name: 'Board Test Team', description: 'For board E2E tests' },
    })
    // May fail if team already exists (re-runs), that's okay - fetch teams instead
    let teamId: string
    if (teamRes.ok()) {
      const team = await teamRes.json()
      teamId = team.id
    } else {
      const teamsRes = await request.get(`${API_URL}/teams`)
      const teams = await teamsRes.json()
      teamId = teams[0].id
    }

    // Create a retro with the default template
    const retroRes = await request.post(`${API_URL}/teams/${teamId}/retros`, {
      data: {
        name: 'Board E2E Retro',
        date: '2026-03-01',
        templateId: 'start-stop-continue',
      },
    })
    expect(retroRes.ok()).toBeTruthy()
    const retro = await retroRes.json()
    retroId = retro.id
  })

  test('board page loads and shows icebreaker phase', async ({ page }) => {
    await page.goto(`/retros/${retroId}/board`)

    // Should see the phase stepper with icebreaker as current
    await expect(
      page.locator('[aria-current="step"]', { hasText: /ice breaker/i }),
    ).toBeVisible({ timeout: 10_000 })

    // Should see the retro name in the nav
    await expect(page.getByText('Board E2E Retro')).toBeVisible()
  })

  test('facilitator can advance phases and add cards', async ({ page }) => {
    await page.goto(`/retros/${retroId}/board`)

    // Wait for board to load
    await expect(
      page.locator('[aria-current="step"]', { hasText: /ice breaker/i }),
    ).toBeVisible({ timeout: 10_000 })

    // Advance to RETROSPECT phase
    await page.getByLabel('Next phase').click()
    await expect(
      page.locator('[aria-current="step"]', { hasText: /retrospect/i }),
    ).toBeVisible()

    // Board columns should be visible (Start / Stop / Continue template)
    await expect(page.getByText('Start', { exact: true })).toBeVisible()
    await expect(page.getByText('Stop', { exact: true })).toBeVisible()
    await expect(page.getByText('Continue', { exact: true })).toBeVisible()

    // Add a card to the first column
    const addButtons = page.getByText('add item...')
    await addButtons.first().click()

    const textarea = page.getByPlaceholder('Type your thought...')
    await textarea.fill('E2E test card content')
    await textarea.press('Enter')

    // Card should appear
    await expect(page.getByText('E2E test card content')).toBeVisible({
      timeout: 5_000,
    })
  })

  test('facilitator can advance to group & vote phase', async ({ page }) => {
    await page.goto(`/retros/${retroId}/board`)
    await expect(
      page.locator('[aria-current="step"]', { hasText: /retrospect/i }),
    ).toBeVisible({ timeout: 10_000 })

    // Advance to GROUP_VOTE
    await page.getByLabel('Next phase').click()
    await expect(
      page.locator('[aria-current="step"]', { hasText: /group & vote/i }),
    ).toBeVisible()

    // Votes remaining indicator should appear
    await expect(page.getByText(/votes.*remaining/i)).toBeVisible()

    // Cards from previous phase should be revealed
    await expect(page.getByText('E2E test card content')).toBeVisible()
  })

  test('facilitator can advance to discuss & action items phase', async ({
    page,
  }) => {
    await page.goto(`/retros/${retroId}/board`)
    await expect(
      page.locator('[aria-current="step"]', { hasText: /group & vote/i }),
    ).toBeVisible({ timeout: 10_000 })

    // Advance to DISCUSS_ACTION
    await page.getByLabel('Next phase').click()
    await expect(
      page.locator('[aria-current="step"]', {
        hasText: /discuss & action items/i,
      }),
    ).toBeVisible()

    // Action items panel should be visible
    await expect(page.getByText('action items')).toBeVisible()
  })

  test('back link navigates to dashboard', async ({ page }) => {
    await page.goto(`/retros/${retroId}/board`)
    await expect(page.getByText('Board E2E Retro')).toBeVisible({
      timeout: 10_000,
    })

    await page.getByText('back').click()
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
