import { test, expect } from '@playwright/test'

const API_URL = `http://localhost:${process.env.API_PORT ?? '3000'}/api`

/**
 * Tests real-time WebSocket syncing between two users on the same retro board.
 *
 * This uses two separate browser contexts with different auth states:
 * - User 1 (facilitator): creates the retro and controls phases
 * - User 2 (participant): joins the same board and observes live updates
 *
 * This is something that fundamentally cannot be tested with unit tests
 * because it requires two real authenticated WebSocket connections hitting
 * the same server room.
 */
test.describe('real-time WebSocket sync', () => {
  let teamId: string
  let retroId: string

  test.beforeAll(async ({ request, playwright }) => {
    // User 1 creates a team
    const teamRes = await request.post(`${API_URL}/teams`, {
      data: { name: 'Sync Test Team', description: 'For WebSocket E2E' },
    })
    let team: { id: string; inviteCode: string }
    if (teamRes.ok()) {
      team = await teamRes.json()
    } else {
      const teamsRes = await request.get(`${API_URL}/teams`)
      const teams = await teamsRes.json()
      team = teams[0]
      // Fetch the full team detail to get inviteCode
      const detailRes = await request.get(`${API_URL}/teams/${team.id}`)
      team = await detailRes.json()
    }
    teamId = team.id

    // User 2 joins the team via invite code
    const user2Context = await playwright.request.newContext({
      storageState: 'e2e/.auth/user2.json',
    })
    await user2Context.post(`${API_URL}/teams/join`, {
      data: { inviteCode: team.inviteCode },
    })
    await user2Context.dispose()

    // User 1 creates a retro
    const retroRes = await request.post(`${API_URL}/teams/${teamId}/retros`, {
      data: {
        name: 'Sync Test Retro',
        date: '2026-03-15',
        templateId: 'start-stop-continue',
      },
    })
    expect(retroRes.ok()).toBeTruthy()
    const retro = await retroRes.json()
    retroId = retro.id
  })

  test('facilitator actions are seen live by participant', async ({
    browser,
  }) => {
    // Create two browser contexts with different auth states
    const facilitatorContext = await browser.newContext({
      storageState: 'e2e/.auth/user.json',
    })
    const participantContext = await browser.newContext({
      storageState: 'e2e/.auth/user2.json',
    })

    const facilitatorPage = await facilitatorContext.newPage()
    const participantPage = await participantContext.newPage()

    try {
      // Both users navigate to the same retro board
      await facilitatorPage.goto(`/retros/${retroId}/board`)
      await participantPage.goto(`/retros/${retroId}/board`)

      // Both should see ICEBREAKER as the current phase
      await expect(
        facilitatorPage.locator('[aria-current="step"]', {
          hasText: /ice breaker/i,
        }),
      ).toBeVisible({ timeout: 10_000 })
      await expect(
        participantPage.locator('[aria-current="step"]', {
          hasText: /ice breaker/i,
        }),
      ).toBeVisible({ timeout: 10_000 })

      // Participant should NOT see phase control buttons (not the facilitator)
      await expect(participantPage.getByLabel('Next phase')).not.toBeVisible()

      // Facilitator advances to RETROSPECT
      await facilitatorPage.getByLabel('Next phase').click()

      // Facilitator sees the change immediately
      await expect(
        facilitatorPage.locator('[aria-current="step"]', {
          hasText: /retrospect/i,
        }),
      ).toBeVisible()

      // Participant should see the phase change via WebSocket (no refresh)
      await expect(
        participantPage.locator('[aria-current="step"]', {
          hasText: /retrospect/i,
        }),
      ).toBeVisible({ timeout: 10_000 })

      // Facilitator adds a card
      await facilitatorPage.getByText('add item...').first().click()
      const textarea = facilitatorPage.getByPlaceholder('Type your thought...')
      await textarea.fill('Synced card from facilitator')
      await textarea.press('Enter')

      // Card appears for facilitator
      await expect(
        facilitatorPage.getByText('Synced card from facilitator'),
      ).toBeVisible({ timeout: 5_000 })

      // During RETROSPECT phase, cards are anonymous/hidden to others.
      // Advance to GROUP_VOTE to reveal cards, then participant should see it.
      await facilitatorPage.getByLabel('Next phase').click()
      await expect(
        facilitatorPage.locator('[aria-current="step"]', {
          hasText: /group & vote/i,
        }),
      ).toBeVisible()

      // Participant should see the revealed card via WebSocket
      await expect(
        participantPage.getByText('Synced card from facilitator'),
      ).toBeVisible({ timeout: 10_000 })
    } finally {
      await facilitatorPage.close()
      await participantPage.close()
      await facilitatorContext.close()
      await participantContext.close()
    }
  })
})
